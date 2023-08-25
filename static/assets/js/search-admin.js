let eliminateHTML = `<button type="button"
                                class="btn btn-danger btn-square-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                    class="bi bi-trash" viewBox="0 0 16 16">
                                    <path
                                        d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                    <path fill-rule="evenodd"
                                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                </svg>
                    </button>`
let updateHTML = `<button type="button"
                                class="btn btn-primary btn-square-md"  data-bs-toggle="modal" data-bs-target="#changeAddressModal">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
</svg>
                    </button>`

let dataTable

$(document).on("load-data", (event, obj) => {
    let data = obj.data
    
    if (!data) data = [] 
    for (el of data) {
        let { _id, nome = "-", indirizzo,
            tipologiaAppartenenza = "NON SPECIFICATA", tipologiaFunzionale = "NON SPECIFICATA", codiceIsil = "-" } = el
        let {location, ...rest} = indirizzo
        let newLine = $(`<tr></tr>`)
        let updateBtn = $(updateHTML)
        let eliminateBtn = $(eliminateHTML)
        let codeCol = $(`<td>${codiceIsil}</td>`)
        let nomeCol = $(`<td>${nome}</td>`)
        let administrCol = $(`<td>${tipologiaAppartenenza}</td>`)
        let funzCol = $(`<td>${tipologiaFunzionale}</td>`)
        let indirizzoCol = $(`<td>${Object.values(rest).join(', ')}</td>`)

        eliminateBtn.attr('id', _id)
        eliminateBtn.click((event) => {
            if (confirm('Attenzione, sei sicuro che la biblioteca selezionata sta per chiudere?'))
                $.post(`/api/close/${$(event.currentTarget).attr('id')}`)
                    .done(() => { reload() })
                    .fail(() => { alert("something went wrong.. try again later") })
        })
        updateBtn.attr('id', _id)

        newLine.append($('<td></td>').append(updateBtn))
        newLine.append(codeCol)
        newLine.append(nomeCol)
        newLine.append(funzCol)
        newLine.append(administrCol)
        newLine.append(indirizzoCol)
        newLine.append($('<td></td>').append(eliminateBtn))

        $('#admin-body').append(newLine)
    }
    dataTable = $('#admin-table').DataTable({"language": {"url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/Italian.json"}})
})

let reload = ()=> {
    $.getJSON('/api/getAll', (data) => { 
        $('#admin-table').DataTable().clear()
        $('#admin-table').DataTable().destroy()
        $(document).trigger('load-data', { data })
    })
}

$(document).ready(() => {
   
    $.getJSON('/api/getAll', (data) => $(document).trigger('load-data', { data }))
    
    $( document ).on("newLibraryEvent", ( event ) => {
        let {ltd, lng, ...data} = $( '#newLibrary' ).serializeJSON({skipFalsyValuesForTypes: ["string"]})
        let library = data

        library.indirizzo.location = {
            'type': 'Point', 
            'coordinates': [
              +ltd, +lng
            ], properties:{"marker-color":"#1ad549","marker-size":"medium","marker-symbol":"library"}
          }

        $.post('/api/create', data)
        .done(() => {reload(); $('#newLibrary input').val(''); $('#newLibrary').modal('hide');})
        .fail(() => {alert('Qualcosa è andato storto')})
    })

    $("#changeAddressModal").on('show.bs.modal', (event)=>{
        let button = event.relatedTarget
        $('#changeAddressModal #identifier').val(button.id)
    })

    $(document).on("changeAddressModalEvent",( event ) => {
        let {_id, ltd, lng, ...rest} = $( '#changeAddressModal' ).serializeJSON({skipFalsyValuesForTypes: ["string"]})
        let address = rest

        address.location = {
            'type': 'Point', 
            'coordinates': [
              +ltd, +lng
            ], properties:{"marker-color":"#1ad549","marker-size":"medium","marker-symbol":"library"}
          }
          console.log(address, _id)
        $.post(`/api/trasferimento/${_id}`, address)
        .done(()=>{reload(); $('#changeAddressModal input').val('');$('#changeAddressModal').modal('hide');})
        .fail(()=>alert('Qualcosa è andato storto'))
    })
})
