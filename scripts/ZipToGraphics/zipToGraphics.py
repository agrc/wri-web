#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
zipToGraphics
----------------------------------
Given a .zip file with a shapefile it validates and then returns the feature as a graphic
'''
from zipfile import ZipFile
from os.path import join
import arcpy

required_files = ['shp', 'dbf', 'prj', 'shx']
wgs = arcpy.SpatialReference(3857)

multiple_warning = ('warning:Multiple features were found in the uploaded shapefile. Only the first was returned. '
                    'Merge your shapefile features into a single multi-part feature to include them all.')
categories = {
    'Terrestrial Treatment Area': ['polygon'],
    'Aquatic/Riparian Treatment Area': ['polygon'],
    'Affected Area': ['polygon'],
    'Easement/Acquisition': ['polygon'],
    'guzzler': ['point', 'multipoint'],
    'trough': ['point', 'multipoint'],
    'water control structure': ['point', 'multipoint'],
    'other point feature': ['point', 'multipoint'],
    'fish passage structure': ['point', 'multipoint'],
    'Fence': ['polyline'],
    'Pipeline': ['polyline'],
    'Dam': ['polyline']
}


def main(zfilepath, category):
    messages = []

    # open zip file and get paths
    zfile = ZipFile(zfilepath)
    zfilenames = zfile.namelist()
    zfile_exts = [name.split('.')[1] for name in zfilenames]
    zfile_name = zfilenames[0].split('.')[0]
    zfile_folder = join(arcpy.env.scratchFolder, zfile_name)
    shapefile = join(zfile_folder, zfile_name + '.shp')

    # verify that all files are present
    for ext in required_files:
        if ext not in zfile_exts:
            raise Exception('Missing .{} file'.format(ext))

    zfile.extractall(zfile_folder)

    # validate geometry
    checkgeom_output = 'in_memory/checkgeometry'
    arcpy.CheckGeometry_management(shapefile, checkgeom_output)
    if int(arcpy.GetCount_management(checkgeom_output).getOutput(0)) > 0:
        with arcpy.da.SearchCursor(checkgeom_output, ['PROBLEM']) as scur:
            raise Exception('Geometry Error: {}'.format(scur.next()[0]))

    # validate geometry type for category
    described = arcpy.Describe(shapefile)
    shape_type = described.shapeType.lower()
    if shape_type not in categories[category]:
        raise Exception('Incorrect shape type of {} for {}'.format(described.shapeType, category))

    # reproject if necessary
    input_sr = described.spatialReference
    if input_sr.name != wgs.name:
        # Project doesn't support the in_memory workspace
        shapefile = arcpy.Project_management(shapefile, '{}/project'.format(arcpy.env.scratchGDB), wgs)

    # only return one feature, if multiple are present
    if int(arcpy.GetCount_management(shapefile).getOutput(0)) > 1:
        messages.append(multiple_warning)
        with arcpy.da.SearchCursor(shapefile, ['OID@']) as scur:
            row = scur.next()
            oid_field = described.OIDFieldName
            where = '{} = {}'.format(oid_field, row[0])
            shapefile = arcpy.MakeFeatureLayer_management(shapefile, 'shapefileLyr', where)
            shapefile = arcpy.CopyFeatures_management(shapefile, 'in_memory/copy')

    return {
        'outFeature': shapefile,

        # messages will be returned as an array in the results json object
        'messages': ';'.join(messages)
    }

if __name__ == '__main__':
    result = main(arcpy.GetParameterAsText(0), arcpy.GetParameterAsText(1))
    arcpy.SetParameterAsText(2, result['outFeature'])
    arcpy.SetParameterAsText(3, result['messages'])
