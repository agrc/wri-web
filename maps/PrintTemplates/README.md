## To Publish

1. Run the Export Web Map tool in ArcGIS Desktop
    * Format=PDF
    * Layout Templates Folder=<this folder>
    * Layout Template=Landscape
1. Publish as async GP Service called `Print`
    * Input mode=Constant value for Format (PDF) and Layout Template (Landscape) parameters.
1. Modify `c:\windows\System32\drivers\etc\hosts` file on server to point it's dns to `127.0.0.1`
    * For example `127.0.0.1 wrimaps.at.utah.gov`  
