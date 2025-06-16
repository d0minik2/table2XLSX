function getAllTables() {
    const tables = Array.from(document.getElementsByTagName("table"));
    let tablesData = tables.map(table => {
        const rows = Array.from(table.rows);
        const headers = Array.from(rows[0].cells).map(cell => cell.textContent.trim())
        const data = rows.slice(1).map(row =>
            Array.from(row.cells).map(cell => cell.innerHTML.trim())
        )
        if (data.length > 0) {

            return {
                id: table.id,
                headers: headers,
                data: data
            };
        }
        return
    });
    tablesData = tablesData.filter((table) => table != null)


    tablesData = tablesData.sort((tableA, tableB) => {
        return tableB.data.length - tableA.data.length
    })

    return tablesData
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTables') {
        const tables = getAllTables();
        sendResponse({ tables: tables });
    }
    return true;
});
