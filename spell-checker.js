import Typo from '/typo-js/typo.js';

class FileLoader {
    constructor(affFilePath = 'https://neptune-skies-spell-checker.netlify.app/typo-js/dictionaries/en_GB/en_GB.aff', 
        dicFilePath = 'https://neptune-skies-spell-checker.netlify.app/typo-js/dictionaries/en_GB/en_GB.dic') {
        this.affFilePath = affFilePath;
        this.dicFilePath = dicFilePath;
        this.affContent = ''; // Property to store content of aff file
        this.dicContent = ''; // Property to store content of dic file
    }

    // Method to Load the files
    async loadFiles() {
        try {
            this.affContent = await this.fetchFile(this.affFilePath);
            this.dicContent = await this.fetchFile(this.dicFilePath);
            return [this.affContent, this.dicContent];
        } catch (error) {
            this.handleError(error);
        }
    }
    async fetchFile(filePath) {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }
        return response.text();
    }

    handleError(error) {
        console.error('There has been a problem with the fetch operation:', error);
        throw error; 
    }
}


class SpellChecker {
    constructor(language_code = 'en_GB'){
        this.language_code = language_code;
        this.regexPunctuation = /[!"#$%&()*+,-./:;<=>?@^_`{|}~]+/g;
    }

        
    // Loading the files using File Loader
    async loadAndStoreFiles() {
        const fileLoader = new FileLoader();
        
        try {
            [this.aff_file, this.dic_file] = await fileLoader.loadFiles();
            
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }

    async createDictionary() {
        this.dictionary = new Typo(this.language_code, this.aff_file, this.dic_file);
        await this.dictionary.ready;
    }

    highlightMisspelled() {
        if (!this.dictionary) {
            console.error("Dictionary hasn't not loaded");
            return;
        }
        else{
            console.log('dictionary loaded')
        }

        const textNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(node => {
            const words = node.textContent.split(/\s+/);
            let newContent = words.map(word => {

                let cleanWord = word.replace(this.regexPunctuation, "");

                if (this.dictionary.check(cleanWord) === false) {
                    return `<span data-word="misspelled">${word}</span>`;
                }
                return word;
            }).join(' ');

            const span = document.createElement('span');
            span.innerHTML = newContent;
            node.parentNode.replaceChild(span, node);
        });
    }

    async run() {
        await this.loadAndStoreFiles();
        await this.createDictionary();
        this.highlightMisspelled();
        this.addStyles();
    }

    // Adding styles to misspelled words 
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            [data-word="misspelled"] {
                background-color: rgba(255, 0, 0, 0.5);

            }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const spellChecker = new SpellChecker();
    spellChecker.run();
});
