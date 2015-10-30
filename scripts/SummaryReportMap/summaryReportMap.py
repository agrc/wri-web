#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
summaryReportMap
----------------
Given a project id this service returns a map image showing the features for that project.
'''
from arcpy import mapping, env, Extent, GetParameterAsText, SetParameterAsText
from os.path import join, dirname
from math import isnan

path_to_mxd = join(dirname(__file__), 'SummaryReport.mxd')
image_path = join(env.scratchFolder, 'map_export.png')


def main(project_id):
    mxd = mapping.MapDocument(path_to_mxd)
    data_frame = mapping.ListDataFrames(mxd)[0]
    feature_layers = mapping.ListLayers(mxd)[0:3]
    xmin = None
    ymin = None
    xmax = None
    ymax = None

    for l in feature_layers:
        l.definitionQuery = 'Project_ID = {}'.format(project_id)
        extent = l.getExtent()
        if xmin is None or isnan(xmin) or extent.XMin < xmin:
            xmin = extent.XMin
        if ymin is None or isnan(ymin) or extent.YMin < ymin:
            ymin = extent.YMin
        if xmax is None or isnan(xmax) or extent.XMax > xmax:
            xmax = extent.XMax
        if ymax is None or isnan(ymax) or extent.YMax > ymax:
            ymax = extent.YMax

    #: validate that features were found
    if isnan(xmin):
        raise Exception('No features found for project id: {}!'.format(project_id))

    data_frame.extent = Extent(xmin, ymin, xmax, ymax)

    mapping.ExportToPNG(mxd, image_path, resolution=300)

    print(image_path)
    return image_path

if __name__ == '__main__':
    result = main(GetParameterAsText(0))
    SetParameterAsText(1, result)
