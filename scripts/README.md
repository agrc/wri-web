## SummaryReportMap & ZipToGraphics Service Deployment Notes

1. Run `RepointMXD.py` to point the mxd to the right source.
1. Validate that the path to `summaryReportMap.py` & `zipToGraphics.py` is the path on your machine.
1. Execute the tools with the inputs below.
1. Right click on the first Result to share the result as a service.
  - If prompted choose overwrite existing service
1. Click `Add Result` on the next screen to add the remaining tool result to the toolbox.
1. Publish with service definition values from below.

### SummaryReportMap

- `projectId: 3121`
- `width: 100`
- `height: 100`

### ZipToGraphics

- `zipFile: scripts/ZipToGraphics/tests/data/Poly_WGS.zip`
- `featureCategory: Affected Area`

### Service Definition

- Service name: `WRI/Toolbox`
- Select `Parameters > Execution Mode`: `Synchronous`
- Select `Parameters > Properties > Message Level`: at least `Warning`. 
  - This is required to allow error message to be properly displayed from within the app.
- Check `Capabilities > Geoprocessing > Operations Allowed`: `Uploads`
- `Pooling`: 1/6 600, 60, 1800
