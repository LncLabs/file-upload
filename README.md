## Basic Cloud Storage

Basic file upload system/my own Cloud Storage or CDN idk using file-upload and express, dont ask me why i did this. This shit is pretty simple and basic so dont expect much, also i'm not that big full-stack backend/frontend dev so... you might already understand where this is going.

I might improve this later on, but since currently i'm busy with many other projects and i dont have that much time it will stay like this for a while.

## Contribute

- Feel free to contribute to this, any feedback, suggestions, and that kind of stuff are also welcome, helps me improve as a developer.

- There might be security-related issues and some known bugs in the current codebase, so opening an issue/pr is also welcome to help me improve.

## Setup

1. First clone this repository

    ```bash
    git clone https://github.com/LncLabs/CDN.git
    ```

2. Install dependencies

    ```bash
    cd CDN
    npm install
    ```

3. Rename `config.json.template` to `config.json` and make sure every field is filled out correctly with the stuff requested.

4. Create the following folders:

    - `users`
    - `files`

`files` is the main folder where only admins provided in config can upload files to.
`users` is the folder where non-admins can upload files to. Each user will have its own folder with its Discord ID.

- Thats why authentication is required to upload files.

5. Run the server

    ```bash
    npm start
    ```
