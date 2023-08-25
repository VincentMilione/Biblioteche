//mappa
var map = L.map('map').setView([40.876460, 14.861223], 8);
var layerGeo = L.layerGroup().addTo(map);
var markers = L.markerClusterGroup();
//base map
var OSM_layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap'}).addTo(map);       
let geo = { ltd :40.887871, lng: 15.0847178}

map.addLayer(markers)
let mapping = (obj) => { 
    obj.location.id = obj._id
    obj.location.coordinates = obj.location.coordinates.reverse()
    
    return obj.location
}

$(document).ready(() => {
    $(document).trigger( "load-within", [ geo, 5000 ] )
    $('#exampleDataList').on('keyup' ,(event) =>{
        
        let name = $('#exampleDataList').val()
        $(document).trigger('load-search', [geo, name])
    })
    $('#customRange').on('change', (e) => $(document).trigger( "load-within", [ geo, $(e.currentTarget).val() * 1000 ] ))
})

$(document).on("load-within", async (event, center, radius) => {
    let { ltd, lng } = center

    $.getJSON('/api/findInRadius', { ltd: ltd , lng : lng , radius : radius}, (data) => {
        let locations = data.map(mapping) 
        $(document).trigger("load-data", {locations})
    })
})

$(document).on("load-search", async (event, center, name) => {
    let { ltd, lng } = center

    if (name?.length === 0 || typeof name === 'undefined') {$(document).trigger( "load-within", [ geo, $('#customRange').val() * 1000 ] ); return;}
    $.getJSON('/api/search', { ltd: ltd , lng : lng , nome : name}, (data) => {
        let locations = data.map(mapping) 
        let names = data.map((e)=> {let {_id, nome} = e; return {_id, nome}}) 
        $(document).trigger("load-data", {locations, names})
    })
})

$(document).on("load-data", (event, data) => {
    layerGeo.clearLayers()
    markers.clearLayers()
    L.geoJson(data.locations,  {
        onEachFeature: (feature, layer) => {
            if (feature.id) layer.on({click: (e) => $(document).trigger("selected", feature.id)});}
    }).addTo(layerGeo)
    markers.addLayer(layerGeo)
})

$(document).on("selected", (event, id) => {
    $(document).trigger('load-search', [geo, $('#exampleDataList').val()])
    $.getJSON(`/api/get/${id}`, (data) => {
        let {nome, codiceIsil, indirizzo} = data

        $('.modal-title').html(`${codiceIsil} - ${nome}`)
        $('.modal-body').html(`<p>${indirizzo.via}, ${indirizzo.cap} ${indirizzo.comune}, ${indirizzo.provincia}</p>`)
        $('#staticBackdrop').modal('show')
    })
})