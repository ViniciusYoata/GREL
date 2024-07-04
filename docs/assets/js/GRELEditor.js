document.addEventListener('DOMContentLoaded', function() {
    initTree();
    initButtons();
});

async function initTree() {
    try {
        $('#tree').jstree({
            'core': {
                'data': async function(node, cb) {
                    const path = node.id === "#" ? 'Scripts' : node.id;
                    const data = await fetchFilesAndFolders(path);
                    cb(data);
                },
                'check_callback': true,
                'themes': { 'icons': true }
            },
            'plugins': ["wholerow", "types"],
            'types': {
                'default': { 'icon': 'jstree-folder' },
                'file': { 'icon': 'jstree-file' }
            }
        }).on('select_node.jstree', async function(e, data) {
            if (data.node.type === 'file') {
                jsonFileName = data.node.text; // Atualiza o nome do arquivo quando um arquivo é selecionado
                jsonContent = await loadJsonContent(data.node.original.download_url);
                renderJsonEditor(jsonContent);
                updateJsonDisplay(jsonContent);
            }
        });
    } catch (error) {
        console.error('Error initializing tree:', error);
    }
}

async function fetchFilesAndFolders(path) {
    const repoOwner = 'ViniciusYoata';
    const repoName = 'GREL';
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const items = await response.json();
    return items.map(item => ({
        id: item.path,
        text: item.name,
        type: item.type === 'file' ? 'file' : 'default',
        children: item.type === 'dir',
        download_url: item.download_url,
        icon: item.type === 'file' ? 'jstree-file' : 'jstree-folder'
    }));
}

async function loadJsonContent(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const json = await response.json();
    jsonModel = JSON.parse(JSON.stringify(json)); // Armazena uma cópia do JSON original como modelo
    return json;
}

function initButtons() {
    document.querySelector('#copyButton').addEventListener('click', copyToClipboard);
    document.querySelector('#downloadButton').addEventListener('click', downloadJson);
}

function copyToClipboard() {
    const jsonContent = document.querySelector('#jsonContent pre').textContent;
    navigator.clipboard.writeText(jsonContent).then(() => {
        alert('Conteúdo copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar texto:', err);
    });
}

function downloadJson() {
    const jsonContentStr = document.querySelector('#jsonContent pre').textContent;
    const blob = new Blob([jsonContentStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = jsonFileName; // Usa o nome do arquivo armazenado
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function renderJsonEditor(json) {
    jsonContent = json; // Atualiza o objeto JSON global
    const jsonEditorContainer = document.querySelector('#jsonEditorContainer');
    jsonEditorContainer.innerHTML = ''; // Limpa o conteúdo anterior
    jsonEditorContainer.appendChild(buildEditorUI(jsonContent)); // Adiciona o novo editor
}

function buildEditorUI(jsonObject, parentKey = '', depth = 0) {
    const container = document.createElement('div');
    Object.keys(jsonObject).forEach(key => {
        const value = jsonObject[key];
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        const editorRow = document.createElement('div');
        editorRow.className = `editor-row depth-${depth}`;

        // Criação do botão de remoção
        const removeItemButton = document.createElement('button');
        removeItemButton.className = 'remove-item-button';
        removeItemButton.innerHTML = '<i class="fas fa-times-circle"></i>';
        removeItemButton.title = 'Remover';
        removeItemButton.onclick = () => removeFieldByKey(fullKey, jsonObject);
        removeItemButton.addEventListener('mouseover', function() {
            this.closest('.editor-row').classList.add('highlight');
        });
        removeItemButton.addEventListener('mouseout', function() {
            this.closest('.editor-row').classList.remove('highlight');
        });

        // Adiciona a classe correspondente ao tipo do valor
        if (typeof value === 'object' && value !== null) {
            removeItemButton.classList.add('object');
        } else {
            removeItemButton.classList.add('primitive');
        }

        const keyLabel = document.createElement('label');
        keyLabel.textContent = key;
        editorRow.appendChild(keyLabel);
        editorRow.appendChild(removeItemButton);

        if (Array.isArray(value)) {
            const listContainer = document.createElement('div');
            value.forEach((item, index) => {
                const itemContainer = document.createElement('div');
                const itemKey = `${fullKey}[${index}]`;

                if (typeof item === 'object' && item !== null) {
                    // Object or array
                    itemContainer.className = `editor-item object-item depth-${depth + 1}`;
                    const nestedEditor = buildEditorUI(item, itemKey, depth + 1);
                    itemContainer.appendChild(nestedEditor);
					
					 const input = document.createElement('input');

                } else {
                    // Primitive value
                    itemContainer.className = `editor-item depth-${depth + 1}`;
                    const input = document.createElement('input');
					input.type = 'text';
					input.value = value;
					input.addEventListener('input', function() {
						setJsonValueByKey(jsonContent, fullKey, this.value);
						updateJsonDisplay(jsonContent);
					});
					editorRow.appendChild(input);
                }

                // Removal button
                const removeItemButton = document.createElement('button');
                removeItemButton.className = 'remove-item-button';
                removeItemButton.innerHTML = '<i class="fas fa-times-circle"></i>';
                removeItemButton.title = 'Remover';
                removeItemButton.onclick = () => removeArrayItemByKey(fullKey, index, jsonObject);
                itemContainer.appendChild(removeItemButton);

                listContainer.appendChild(itemContainer);
            });

            editorRow.appendChild(listContainer);

            // Add item button
            const addItemButton = document.createElement('button');
            addItemButton.textContent = 'Adicionar Item';
            addItemButton.onclick = () => addArrayItem(fullKey, value);
            editorRow.appendChild(addItemButton);
        } else if (typeof value === 'object' && value !== null) {
            // Tratamento para objetos
            const objectEditor = buildEditorUI(value, fullKey, depth + 1);
            editorRow.appendChild(objectEditor);
        } else {
                   // Tratamento para valores primitivos
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.addEventListener('input', function() {
            setJsonValueByKey(jsonContent, fullKey, this.value);
            updateJsonDisplay(jsonContent);
        });
        editorRow.appendChild(input);
			
			
			
			  

  
	
	

        }

        container.appendChild(editorRow);
    });

    return container;
}

function removeFieldByKey(keyPath, jsonObject) {
    const keys = keyPath.split('.').filter(Boolean);
    let current = jsonObject;

    // Navega até o penúltimo objeto para obter o objeto pai do item a ser removido
    for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined) {
            console.error('Caminho da chave inválido');
            return;
        }
        current = current[keys[i]];
    }

    // O último item do array 'keys' é a chave do item a ser removido
    const lastKey = keys[keys.length - 1];

    // Verifica se é um índice de array
    if (Array.isArray(current) && /^\d+$/.test(lastKey)) {
        // Remove o item do array pelo índice
        current.splice(parseInt(lastKey, 10), 1);
    } else {
        // Remove o item do objeto pelo nome da chave
        delete current[lastKey];
    }

    // Atualiza a interface do usuário e o display do JSON
    renderJsonEditor(jsonObject);
    updateJsonDisplay(jsonObject);
}


function addArrayItem(keyPath, array) {
    let newItem;
    if (array.length > 0) {
        // Se o array não estiver vazio, verifique o tipo do primeiro item
        const firstItemType = typeof array[0];
        if (firstItemType === 'object' && array[0] !== null) {
            // Se o primeiro item for um objeto, clone esse objeto
            newItem = cloneItem(array[0]);
        } else {
            // Se o primeiro item for um valor primitivo, crie um novo valor primitivo
            newItem = getDefaultForType(firstItemType);
        }
    } else {
        // Se o array estiver vazio, tente obter um modelo para o item
        const modelItem = getModelItem(jsonModel, keyPath);
        if (modelItem !== undefined) {
            // Se um modelo existir, clone o item do modelo
            newItem = cloneItem(modelItem);
        } else {
            // Como último recurso, crie um novo valor primitivo padrão
            newItem = getDefaultForType('string'); // Ou outro valor primitivo padrão que faça sentido para o seu caso
        }
    }
    
    array.push(newItem);
    renderJsonEditor(jsonContent);
    updateJsonDisplay(jsonContent);
}

function getDefaultForType(type) {
    switch (type) {
        case 'number':
            return 0;
        case 'boolean':
            return false;
        case 'string':
            return '';
        default:
            return ''; // Pode ser necessário ajustar isso com base no seu caso de uso
    }
}

function cloneItem(item) {
    if (typeof item === 'object' && item !== null) {
        return JSON.parse(JSON.stringify(item));
    } else {
        return getDefaultForType(typeof item); // Para valores primitivos
    }
}


function getDefaultForType(type) {
    switch (type) {
        case 'number':
            return 0;
        case 'boolean':
            return false;
        case 'string':
            return '';
        case 'object':
            return {};
        default:
            return '';
    }
}

function updateJsonDisplay(json) {
    const pre = document.querySelector('#jsonContent pre');
    pre.textContent = JSON.stringify(json, null, 2);
    hljs.highlightElement(pre);
}

function setJsonValueByKey(jsonObj, keyPath, newValue) {
    const keys = keyPath.split(/\.|\[|\]/).filter(key => key);
    let current = jsonObj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
            current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
        }
        current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    current[lastKey] = newValue;
}

function removeArrayItemByKey(keyPath, index, jsonObject) {
    const keys = keyPath.split(/\.|\[|\]/).filter(key => key);
    let current = jsonObject;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current[lastKey])) {
        current[lastKey].splice(index, 1);
        renderJsonEditor(jsonObject);
        updateJsonDisplay(jsonObject);
    } else {
        console.error('Tentativa de remover um item que não está em um array.');
    }
}


let jsonContent; // Armazena o conteúdo JSON atual
let jsonFileName; // Armazena o nome do arquivo JSON atual
let jsonModel; // Armazena uma cópia do modelo JSON original

// Verifique se as bibliotecas externas, como jstree e highlight.js, estão carregadas
if (typeof $ === 'undefined' || typeof $.jstree === 'undefined') {
    console.error('jstree library is not loaded.');
}

if (typeof hljs === 'undefined') {
    console.error('highlight.js library is not loaded.');
}
