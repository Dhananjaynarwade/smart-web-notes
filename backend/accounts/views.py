import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailOTP
from .serializers import RegisterSerializer
from django.contrib.auth import authenticate

from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


# ==========================================
# REGISTER
# ==========================================

class RegisterView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = serializer.save()

        # User cannot login until OTP verification
        user.is_active = False
        user.save(
            update_fields=['is_active']
        )

        # Generate secure 6-digit OTP
        otp_code = f'{secrets.randbelow(1000000):06d}'

        # OTP expires after 5 minutes
        expires_at = (
            timezone.now()
            + timedelta(minutes=5)
        )

        email_otp, _ = EmailOTP.objects.update_or_create(
            user=user,
            defaults={
                'expires_at': expires_at,
                'is_verified': False,
            }
        )

        # Hash OTP before storing
        email_otp.set_otp(otp_code)
        email_otp.save()

        # Send OTP to email
        send_mail(
            subject='Smart Web Notes - Verify Your Email',

            message=(
                f'Hello {user.username},\n\n'
                f'Your verification OTP is: {otp_code}\n\n'
                'This OTP expires in 5 minutes.\n\n'
                'Smart Web Notes'
            ),

            from_email=getattr(
                settings,
                'DEFAULT_FROM_EMAIL',
                'noreply@smartwebnotes.com'
            ),

            recipient_list=[
                user.email
            ],

            fail_silently=False,
        )

        return Response(
            {
                'message': (
                    'Registration successful. '
                    'OTP sent to your email.'
                ),

                'email': user.email
            },

            status=status.HTTP_201_CREATED
        )


# ==========================================
# VERIFY OTP
# ==========================================

class VerifyOTPView(APIView):

    def post(self, request):

        email = request.data.get('email')
        otp_code = request.data.get('otp')

        if not email or not otp_code:
            return Response(
                {
                    'message':
                        'Email and OTP are required.'
                },

                status=status.HTTP_400_BAD_REQUEST
            )

        # Find user
        try:
            user = User.objects.get(
                email=email
            )

        except User.DoesNotExist:

            return Response(
                {
                    'message': 'User not found.'
                },

                status=status.HTTP_404_NOT_FOUND
            )

        # Find OTP
        try:
            email_otp = EmailOTP.objects.get(
                user=user
            )

        except EmailOTP.DoesNotExist:

            return Response(
                {
                    'message': 'OTP not found.'
                },

                status=status.HTTP_404_NOT_FOUND
            )

        # Already verified
        if email_otp.is_verified:

            return Response(
                {
                    'message':
                        'Email already verified.'
                },

                status=status.HTTP_400_BAD_REQUEST
            )

        # Check expiry
        if email_otp.is_expired():

            return Response(
                {
                    'message':
                        'OTP has expired.'
                },

                status=status.HTTP_400_BAD_REQUEST
            )

        # Check OTP
        if not email_otp.check_otp(
            otp_code
        ):

            return Response(
                {
                    'message':
                        'Invalid OTP.'
                },

                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark OTP verified
        email_otp.is_verified = True

        email_otp.save(
            update_fields=[
                'is_verified'
            ]
        )

        # Activate account
        user.is_active = True

        user.save(
            update_fields=[
                'is_active'
            ]
        )

        return Response(
            {
                'message':
                    'Email verified successfully.'
            },

            status=status.HTTP_200_OK
        )
# ==========================================
# LOGIN
# ==========================================

class LoginView(APIView):

    def post(self, request):

        username_or_email = request.data.get(
            'username'
        )

        password = request.data.get(
            'password'
        )

        if not username_or_email or not password:
            return Response(
                {
                    'message':
                        'Username/email and password are required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Allow login using email or username
        try:
            if '@' in username_or_email:

                user_obj = User.objects.get(
                    email=username_or_email
                )

                username = user_obj.username

            else:
                username = username_or_email

                user_obj = User.objects.get(
                    username=username
                )

        except User.DoesNotExist:
            return Response(
                {
                    'message':
                        'Invalid username/email or password.'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check OTP verification / active account
        if not user_obj.is_active:
            return Response(
                {
                    'message':
                        'Please verify your email OTP first.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        user = authenticate(
            username=username,
            password=password
        )

        if user is None:
            return Response(
                {
                    'message':
                        'Invalid username/email or password.'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Create JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'message':
                    'Login successful.',

                'access':
                    str(refresh.access_token),

                'refresh':
                    str(refresh),

                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            },
            status=status.HTTP_200_OK
        )