# SummaryReportMap & ZipToGraphics Service Deployment Notes

You may need to update the path to `summaryReportMap.py` & `zipToGraphics.py` in the toolbox to match the path on your machine.

Verify that the feature layers within `SummaryReportMap/SummaryReport.mxd` are pointing at the correct database.

Use project id 3121 to run SummaryReportMap in preparation for publishing.

Use `scripts/ZipToGraphics/tests/data/Poly_WGS.zip` and `"Affected Area"` to run the tool in preparation for publishing.

Service name: `WRI/Toolbox`

Synchronous

Allow Uploads

Message Level should be at least `Error`. This is required to allow error message to be properly displayed from within the app.
