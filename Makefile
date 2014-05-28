#
# Make file for Lacu
#


# Downloads
data/bath_contln3.zip:
	curl -o data/bath_contln3.zip 'ftp://ftp.dnr.state.mn.us/pub/deli/d31302343658330.zip'

data/lake_dnrpy2.zip:
	curl -o data/lake_dnrpy2.zip 'ftp://ftp.dnr.state.mn.us/pub/deli/d15079344790019.zip'


# Unarchive downloads
data/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp: data/bath_contln3.zip
	unzip data/bath_contln3.zip -d data/bath_contln3-shp
	touch data/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp

data/lake_dnrpy2-shp/mndnrdata/state/mn/lake_dnrpy2.shp: data/lake_dnrpy2.zip
	unzip data/lake_dnrpy2.zip -d data/lake_dnrpy2-shp
	touch data/lake_dnrpy2-shp/mndnrdata/state/mn/lake_dnrpy2.shp


# Reproject
data/reprojected_4326-shps/bath_contln3.shp: data/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp
	mkdir -p data/reprojected_4326-shps
	ogr2ogr -f "ESRI Shapefile" data/reprojected_4326-shps/bath_contln3.shp data/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp -t_srs EPSG:4326;

data/reprojected_4326-shps/lake_dnrpy2.shp: data/lake_dnrpy2-shp/mndnrdata/state/mn/lake_dnrpy2.shp
	mkdir -p data/reprojected_4326-shps
	ogr2ogr -f "ESRI Shapefile" data/reprojected_4326-shps/lake_dnrpy2.shp data/lake_dnrpy2-shp/mndnrdata/state/mn/lake_dnrpy2.shp -t_srs EPSG:4326;

reproject: data/reprojected_4326-shps/bath_contln3.shp data/reprojected_4326-shps/lake_dnrpy2.shp
