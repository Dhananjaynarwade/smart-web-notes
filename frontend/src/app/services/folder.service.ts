# Angular Project Creation - NPM Install Error

## Date

26 September 2026

## Project

Mini AWS

## Error

While creating the Angular project using:

ng new mini-aws-frontend

npm failed during package installation.

Error:

npm ERR! Cannot read properties of null (reading 'edgesOut')

npm ERR! Package install failed.

The Schematic workflow failed.

---

# What caused it?

The Angular CLI successfully started creating the application.

The failure happened when npm was resolving/installing the project's
dependencies.

Possible reasons include:

- npm dependency-tree resolution problem
- npm cache problem
- npm version bug
- incomplete previous installation
- corrupted node_modules/package-lock state

This was NOT an Angular application code error.

---

# Step 1 - Check Node and npm

Run:

node -v

npm -v

---

# Step 2 - Check npm

Run:

npm doctor

---

# Step 3 - Clean npm cache if required

Run:

npm cache clean --force

Then verify:

npm cache verify

---

# Step 4 - Remove incomplete project if ng new failed

Example:

cd /d "D:\Cloud projects"

rmdir /s /q mini-aws-frontend

Only do this if the Angular project creation failed and the folder contains
an incomplete project.

---

# Step 5 - Create project again

Run:

ng new mini-aws-frontend

Options:

Routing        = Yes
Stylesheet     = CSS
SSR / SSG      = No
AI Integration = None

---

# Successful Result

The second installation completed with:

Packages installed successfully.

Successfully initialized git.

Therefore the Angular project was created successfully.

---

# Important

Do not delete or recreate the project if:

ng new

has already completed successfully.

Test the project first:

cd /d "D:\Cloud projects\mini-aws-frontend"

ng serve

Open:

http://localhost:4200

---

# Windows Git Warning

Warnings such as:

LF will be replaced by CRLF

are normal Windows Git line-ending warnings.

They do not mean the Angular project failed.