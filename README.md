# Format Bin

A private gallery of 55 video formats, each with a reference code:

- `lemo:<slug>` — a Lemo-Opuscar style
- `ai:<skill>` — an AI_Animation skill
- `house:<name>` — a format saved from a reference reel

Live site: https://format-bin-videos.vercel.app

## Access

The gallery is password-protected. To get the password, contact me on [WhatsApp](https://wa.me/919619141433) or [Instagram](https://instagram.com/_.bhavya._015).

![Format Bin login page](docs/login.png)

## How it works

- `middleware.js` runs on Vercel before every request. Visitors without a valid access cookie go to `login.html`.
- The password is not stored in the repo. `middleware.js` holds only two SHA-256 hashes of it, so the public code does not reveal it.
- A correct password sets an HttpOnly cookie for 30 days. Visit `/api/logout` to sign out.
- To change the password, recompute both hashes and replace `CRED_HASH` and `COOKIE_HASH`:

```sh
python3 -c 'import hashlib,sys; h=lambda s: hashlib.sha256(s.encode()).hexdigest(); p=sys.argv[1]; print(h("format-bin-cred:"+p)); print(h(h("format-bin-cookie:"+p)))' 'NEW_PASSWORD'
```

## Editing the gallery

`template.html` is the source; `build_gallery.py` inlines `lemo.json` into `index.html`. Thumbnails live in `thumbs/`, source images in `raw/`.
