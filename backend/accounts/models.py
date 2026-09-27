import uuid

from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.db import models
from django.utils import timezone


class EmailOTP(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_otp'
    )

    otp = models.CharField(
        max_length=128
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    expires_at = models.DateTimeField()

    is_verified = models.BooleanField(
        default=False
    )

    def set_otp(self, raw_otp):
        self.otp = make_password(raw_otp)

    def check_otp(self, raw_otp):
        return check_password(
            raw_otp,
            self.otp
        )

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f'OTP for {self.user.username}'