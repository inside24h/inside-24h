"""Research helper: search Europe PMC and pull sentences from open-access full texts.

Usage:
  python epmc.py search "<query>" [n]
  python epmc.py grep <PMCID> "<regex>" [more regexes...]

Full texts are cached in research/sources/<PMCID>.xml so every quoted sentence can be re-checked.
"""
import json, os, re, sys, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

API = "https://www.ebi.ac.uk/europepmc/webservices/rest"
CACHE = os.path.join(os.path.dirname(__file__), "..", "sources")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "inside-24h-research/0.1"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def search(q, n=10):
    url = f"{API}/search?query={urllib.parse.quote(q)}&format=json&pageSize={n}&resultType=lite"
    for r in json.loads(get(url))["resultList"]["result"]:
        oa = "OA" if r.get("isOpenAccess") == "Y" else "  "
        print(f"{r.get('pmcid') or r.get('pmid','-'):12} {oa} {r.get('pubYear','')} {r.get('authorString','')[:40]:40} | {r.get('title','')[:110]}")


def abstract(ident):
    """Print citation + abstract. ident is a PMCID (PMC...) or a PMID."""
    q = f"PMCID:{ident}" if ident.upper().startswith("PMC") else f"EXT_ID:{ident} AND SRC:MED"
    url = f"{API}/search?query={urllib.parse.quote(q)}&format=json&resultType=core"
    r = json.loads(get(url))["resultList"]["result"][0]
    cite = f"{r.get('authorString','')} ({r.get('pubYear','')}). {r.get('title','')} {r.get('journalInfo',{}).get('journal',{}).get('title','')}. PMID {r.get('pmid','-')}, DOI {r.get('doi','-')}"
    print(cite + "\n")
    print(re.sub(r"</?[a-zA-Z][^>]*>", " ", r.get("abstractText", "(no abstract)")))


def fulltext(pmcid):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"{pmcid}.xml")
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(get(f"{API}/{pmcid}/fullTextXML"))
    root = ET.parse(path).getroot()
    title = "".join(root.find(".//article-title").itertext()) if root.find(".//article-title") is not None else ""
    paras = ["".join(p.itertext()) for p in root.iter() if p.tag in ("p", "td", "caption")]
    return title, paras


def grep(pmcid, patterns):
    title, paras = fulltext(pmcid)
    print(f"# {pmcid}: {title}\n")
    rx = [re.compile(p, re.I) for p in patterns]
    seen = set()
    for para in paras:
        for sent in re.split(r"(?<=[.;])\s+(?=[A-Z(])", " ".join(para.split())):
            if sent not in seen and any(r.search(sent) for r in rx):
                seen.add(sent)
                print("-", sent[:600])


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "search":
        # "~" stands in for a double quote: Windows PowerShell 5.1 strips quotes from native arguments
        n = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 10
        search(sys.argv[2].replace("~", '"'), n)
    elif cmd == "abs":
        for ident in sys.argv[2:]:
            abstract(ident)
            print("\n" + "=" * 60 + "\n")
    elif cmd == "grep":
        grep(sys.argv[2], sys.argv[3:])


