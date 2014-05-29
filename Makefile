#
# Make file for Lacu
#


# Downloads
data/original/bath_contln3.zip:
	mkdir -p data/original
	curl -o data/original/bath_contln3.zip 'ftp://ftp.dnr.state.mn.us/pub/deli/d31302343658330.zip'

data/original/lake_dnrpy2.zip:
	mkdir -p data/original
	curl -o data/original/lake_dnrpy2.zip 'ftp://ftp.dnr.state.mn.us/pub/deli/d15079344790019.zip'

# Unarchive downloads
data/build/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp: data/original/bath_contln3.zip
	mkdir -p data/build
	unzip data/original/bath_contln3.zip -d data/build/bath_contln3-shp
	touch data/build/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp

data/build/lake_dnrpy2-shp/mndnrdata/state/mn/lake_dnrpy2.shp: data/original/lake_dnrpy2.zip
	mkdir -p data/build
	unzip data/original/lake_dnrpy2.zip -d data/build/lake_dnrpy2-shp
	touch data/build/lake_dnrpy2-shp/mndnrdata/state/mn/lake_dnrpy2.shp

unpack: data/build/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp data/build/lake_dnrpy2-shp/mndnrdata/state/mn/lake_dnrpy2.shp

# Reproject and filter
data/build/filtered_4326-shps/bath_contln3.shp: unpack
	mkdir -p data/build/filtered_4326-shps
	ogr2ogr -f "ESRI Shapefile" data/build/filtered_4326-shps/bath_contln3.shp data/build/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp -overwrite -t_srs "EPSG:4326";

data/build/filtered_4326-shps/lake_dnrpy2.shp: unpack
	mkdir -p data/build/filtered_4326-shps
	ogr2ogr -f "ESRI Shapefile" data/build/filtered_4326-shps/lake_dnrpy2.shp data/build/lake_dnrpy2-shp/mndnrdata/state/mn/lake_dnrpy2.shp -overwrite -where "DOWLKNUM NOT LIKE '%000'" -t_srs "EPSG:4326";

reproject: data/build/filtered_4326-shps/bath_contln3.shp data/build/filtered_4326-shps/lake_dnrpy2.shp

# Topojson
data/lakes.topo.json: reproject
	topojson \
		--width 900 \
		--height 600 \
		--margin 20 \
		--bbox \
		-s 0.01 \
		--projection "d3.geo.albersUsa()" \
		--id-property "DOWLKNUM" \
		-p \
		-o data/lakes.topo.json \
		-- lakes="data/build/filtered_4326-shps/lake_dnrpy2.shp"

# Main
main: data/lakes.topo.json
