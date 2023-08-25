$(document).on("load-data", (event, data) => {
    let {names} = data
    let datalist = $('#dropdownLst')
    let input = $('#exampleDataList')

    datalist.empty()
    if (!names) return
    
    for (el of names) {
        let li = $('<li></li>')
        let a = $(`<a class="dropdown-item">${el.nome}</a>`)

        a.attr('id', el._id)
        a.click(() => {
            input.val(a.html())
            $(document).trigger("selected", a.attr('id'))
        })

        li.append(a)
        datalist.append(li)
    }
})