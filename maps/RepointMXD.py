# repoint mxds at dev or AT Database
# requires that you have database connections in
# catalog with the names below
import arcpy
import glob


db = r'Database Connections\\'
local = db + 'WRI_LOCAL.sde'
dev = db + 'WRI_DEV as wri_user.sde'
at = db + 'WRI_AT as wri_user.sde'

target = raw_input('Dev (D) or AT (A)? ')

if target == 'D':
    dest = dev
else:
    dest = at

for f in glob.glob('*.local.mxd'):
    print(f)
    mxd = arcpy.mapping.MapDocument(f)
    l = arcpy.mapping.ListLayers(mxd)[0]
    mxd.findAndReplaceWorkspacePaths(l.workspacePath, dest, True)
    mxd.save()

print('done')
