class table2XLSX {
    choosenTable = null
    choosenTableIndex = null

    constructor(formatRowFn = undefined, formatColFn = undefined) {
        this.formatRowFn = formatRowFn ?? ((row) => row);
        this.formatColFn = formatColFn ?? ((header) => header);

        this.mainPage = document.getElementById("mainPage")
        this.settingsPage = document.getElementById("settingsPage")

        // elements
        this.tableLabel = document.getElementById("table")
        this.editTableBtn = document.getElementById("editTableBtn")
        this.selectedColumnsElement = document.getElementById("selectedColumns")
        this.downloadBtn = document.getElementById("downloadBtn")
        this.downloadAllBtn = document.getElementById("downloadAllBtn")
        this.tablesDiv = document.getElementById("tables")
        this.selectedColumnsSettingsElement = document.getElementById("selectedColumnsSettings")
        this.saveSettingsBtn = document.getElementById("saveSettings")

        this.settingsPage.style.display = "none"

        this.editTableBtn.onclick = () => { this.openSettings() }
        this.saveSettingsBtn.onclick = () => { this.saveSettings() }
        this.downloadBtn.onclick = () => { this.downloadTable() }
        this.downloadAllBtn.onclick = () => { this.downloadAllTables() }

        this.getTableData()
    }

    async getTableData() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getTables' });

            if (!response || !response.tables || response.tables.length === 0) {
                this.mainPage.innerHTML = '<p class="error">Nie znaleziono tabel</p>';
                this.settingsPage.innerHTML = '<p class="error">Nie znaleziono tabel</p>';
                return;
            }

            this.tablesData = response.tables;
            console.log(this.tablesData)
            this.updateSettings()
        } catch (error) {
            this.mainPage.innerHTML = '<p class="error">Nie znaleziono tabel</p>';
            this.settingsPage.innerHTML = '<p class="error">Nie znaleziono tabel</p>';
            console.log(error)
        }
    }

    openSettings() {
        this.settingsPage.style.display = "flex"
        this.mainPage.style.display = "none"
    }

    updateSettings() {
        let i = 1
        this.tablesData.forEach(table => {
            const id = table.id || "Table" + i
            table.id = id + ""
            console.log(id, table)
            const input = document.createElement("input")
            this.tablesDiv.append(input)
            input.name = "table"
            input.type = "radio"
            input.id = id
            input.value = id
            if (i == 1) {
                input.checked = true
                this.choosenTable = id
                this.choosenTableIndex = i - 1
                this.tableLabel.innerText = this.choosenTable

                this.selectedColumnsElement.innerText = table.headers.join(", ")
                this.selectedColumnsSettingsElement.innerText = table.headers.join(", ")
            }
            const label = document.createElement("label")
            this.tablesDiv.append(label)
            label.htmlFor = id
            label.innerText = id
            input.onchange = () => { this.onChangeSettings() }
            i++
        });
    }

    onChangeSettings() {
        this.choosenTable = document.querySelector('input[name="table"]:checked').value
        this.tableLabel.innerText = this.choosenTable

        const table = this.tablesData.find((table) => table.id === this.choosenTable)

        this.selectedColumnsElement.innerText = table.headers.join(", ")
        this.selectedColumnsSettingsElement.innerText = table.headers.join(", ")

        this.choosenTableIndex = this.tablesData.findIndex((table) => table.id === this.choosenTable)
    }

    saveSettings() {
        this.settingsPage.style.display = "none"
        this.mainPage.style.display = "flex"
    }

    downloadTable() {
        try {
            const table = this.tablesData.find((table) => table.id === this.choosenTable);

            const ws = XLSX.utils.aoa_to_sheet([
                table.headers.map(this.formatColFn),
                ...table.data.map(this.formatRowFn)
            ]);

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, this.choosenTable);

            XLSX.writeFile(wb, "table.xlsx")

        } catch (error) {
            console.error(error);
            alert("błąd zapisywania");
        }
    }

    async downloadAllTables() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            let hasNextPage = true;
            let allTablesData = [];

            // wroc na poczatek stron
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const firstPageLink = document.querySelector('a[data-dt-idx="1"]');
                    if (firstPageLink) {
                        firstPageLink.click();
                        return true;
                    }
                    return false;
                }
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            while (hasNextPage) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'getTables' });
                if (response && response.tables && response.tables.length > 0) {
                    allTablesData = allTablesData.concat(response.tables[this.choosenTableIndex].data);
                }

                const hasNext = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        const nextButton = document.getElementById('table_b_next');
                        if (nextButton && !nextButton.disabled && !nextButton.className.includes("disabled")) {
                            nextButton.click();
                            return true;
                        }
                        return false;
                    }
                });

                hasNextPage = hasNext[0].result;
                if (hasNextPage) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (allTablesData.length > 0) {
                const firstTable = this.tablesData[0];
                const ws = XLSX.utils.aoa_to_sheet([
                    firstTable.headers.map(this.formatColFn),
                    ...allTablesData.map(this.formatRowFn)
                ]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "tableData");
                XLSX.writeFile(wb, "table.xlsx");
            } else {
                alert("Błąd pobierania");
            }
        } catch (error) {
            console.error(error);
            alert("Błąd pobierania");
        }
    }
}

const fixUwagi = (row) => {
    const uwagi = row[row.length - 1]
    console.log(uwagi)
    let searchedPhrase = "Data urodzenia: "

    if (uwagi.includes(searchedPhrase)) {
        const phraseIndex = uwagi.indexOf(searchedPhrase)
        row[row.length - 1] = uwagi.substr(phraseIndex + searchedPhrase.length, 10)
    } else {
        searchedPhrase = "Data urodzenia "
        if (uwagi.includes(searchedPhrase)) {
            const phraseIndex = uwagi.indexOf(searchedPhrase)

            let date = new Date(uwagi.substr(phraseIndex + searchedPhrase.length, 10)).toLocaleDateString()
            if (date == "Invalid Date") {
                date = new Date(uwagi.substr(phraseIndex + searchedPhrase.length, 7)).toLocaleDateString()
            }
            row[row.length - 1] = date
        } else {
            row[row.length - 1] = "brak"
            console.log(row)
        }
    }

    return row
}

const fixUwagiHeader = (header) => {
    if (header == "Uwagi") {
        return "Data urodzenia"
    }
    return header
}

const tableDownloader = new table2XLSX(fixUwagi, fixUwagiHeader)

