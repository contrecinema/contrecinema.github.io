import json, os, urllib.request, urllib.parse

SB = "https://qclqyqjxsnnhlnlhjybo.supabase.co"
KEY = "sb_publishable_zTxQEl6b0KSv1fE9tG202g_Rt4X05YV"

COLS = {
    "articles": ["author_image", "image_1", "image_2", "image_3"],
    "team": ["image_url"],
    "issues": ["pdf_url", "cover_image"],
    "editors": ["image_url"],
}
MARK = "/storage/v1/object/public/"

urls = set()
for t, cols in COLS.items():
    req = urllib.request.Request(
        f"{SB}/rest/v1/{t}?select={','.join(cols)}",
        headers={"apikey": KEY},
    )
    for row in json.load(urllib.request.urlopen(req)):
        for c in cols:
            if row[c] and MARK in row[c]:
                urls.add(row[c])

print(len(urls), "ملف")
for u in urls:
    p = urllib.parse.unquote(u.split(MARK)[1].split("?")[0])
    d = os.path.join("media", p)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    if not os.path.exists(d):
        try:
            urllib.request.urlretrieve(u, d)
            print("ok", p)
        except Exception as e:
            print("FAIL", p, e)