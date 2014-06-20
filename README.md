# Lacu

Northern Spark lake art.  View demo at [code.minnpost.com/minnpost-lacu](http://code.minnpost.com/minnpost-lacu/).

DNR says there are 11,842 lakes (10+ acres), but with their data and grouping by basin, we were able to get 13,817 lakes.  The different may be that the data provided by the DNR does not differentiate natural and man-made lakes?

## Data

The DNR Deli, an awesome place, makes it difficult to directly link to specific data sets, and some data sets are not listed in the download section.  Their interface allows you to pick multiple datasets and bundle them together to download, but this is not helpful for linking to datasets.  Do note that by using this data, you do agree to their terms of use.

A list of datasets can be found from this [JS file](http://deli.dnr.state.mn.us/javascript/data_layer_def.js).

* [DNR Lake Bathymetric Contours](http://deli.dnr.state.mn.us/metadata.html?id=L390001700202)
    * [Data request link](http://deli.dnr.state.mn.us/cgi-bin/bundle.pl?layer=L390001700202&email=get%40data.com&assemblytype=tiles&data=bath_contln3+mn&kbytes=1)
    * (time specific) [Direct bundle](ftp://ftp.dnr.state.mn.us/pub/deli/d31302343658330.zip)
* The [DNR 24K Lakes](http://deli.dnr.state.mn.us/metadata.html?id=L260000062101) data source on the DNR site is a bit old.
    * A [new one](ftp://ftp.dnr.state.mn.us/pub/gisftp/hawatson/water_dnr_hydrography.zip) has been posted at our request.
* (old lake source) [DNR 100K Lakes and Rivers](http://deli.dnr.state.mn.us/metadata.html?id=L390003700201)
    * [Data request link](http://deli.dnr.state.mn.us/cgi-bin/bundle.pl?layer=L390003700201&email=get%40data.com&assemblytype=tiles&data=lake_dnrpy2+mn&kbytes=1)
    * (time specific) [Direct bundle](ftp://ftp.dnr.state.mn.us/pub/deli/d15079344790019.zip)

The MPCA provides nice API's, but bulk files were emailed directly to us and included in this repository.  Do note that decimals points were removed from the data received, probably due to some weird Excel conversion.

* Condition Summaries are narrative summary of the water quality.
* TSI Summaries are data use to calculate the [Trophic State Index](http://www.lakeaccess.org/lakedata/datainfotsi.html).  "Trophic State Indices (TSIs) are an attempt to provide a single quantitative index for the purpose of classifying and ranking lakes, most often from the standpoint of assessing water quality."
* Transparency Trends are narratives of the transparency trends for each water unit (lake).
* Water Units are basic info on each water unit (lake).

## Notes

* http://en.wikipedia.org/wiki/List_of_lakes_in_Minnesota
* http://www.dnr.state.mn.us/faq/mnfacts/water.html
* http://www.dnr.state.mn.us/lakes/faqs.html
  * "Generally, a lake is an area of open, relatively deep water that is large enough to produce a wave-swept shore."
  
## About Us

MinnData, the MinnPost data team, is Alan, Tom, and Kaeti and all the awesome contributors to open source projects we utilize.  See our work at [minnpost.com/data](http://minnpost.com/data).

```

                                                   .--.
                                                   `.  \
                                                     \  \
                                                      .  \
                                                      :   .
                                                      |    .
                                                      |    :
                                                      |    |
      ..._  ___                                       |    |
     `."".`''''""--..___                              |    |
     ,-\  \             ""-...__         _____________/    |
     / ` " '                    `""""""""                  .
     \                                                      L
     (>                                                      \
    /                                                         \
    \_    ___..---.                                            L
      `--'         '.                                           \
                     .                                           \_
                    _/`.                                           `.._
                 .'     -.                                             `.
                /     __.-Y     /''''''-...___,...--------.._            |
               /   _."    |    /                ' .      \   '---..._    |
              /   /      /    /                _,. '    ,/           |   |
              \_,'     _.'   /              /''     _,-'            _|   |
                      '     /               `-----''               /     |
                      `...-'                                       `...-'

```
