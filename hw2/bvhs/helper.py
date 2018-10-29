import glob
bvhjs = []
bvhhtml = []
for i, fn in enumerate(glob.glob("*.bvh")):
    with open(fn) as f:
        bvhjs.append("bvhs.push(`{}`)".format(f.read()))
        bvhhtml.append("<option value={}>{}</option>".format(i, fn))

with open("bvh.js", "w") as f:
    f.write("bvhs=[]\n")
    f.write("\n".join(bvhjs))
with open("bvh.html", "w") as f:
    f.write("\n".join(bvhhtml))
