// ==UserScript==
// @name         uchi.ru auto answers
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Отображает ответы от тестов
// @author       progame1201 + chatGPT
// @match        https://uchi.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Добавляем стили через обычный DOM
    const style = document.createElement('style');
    style.textContent = `
        .answers-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 2px solid #ccc;
            padding: 15px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
        }
        .answers-list {
            max-height: 300px;
            overflow-y: auto;
        }
        .answer-item {
            margin: 5px 0;
            padding: 5px;
            border-bottom: 1px solid #eee;
        }
    `;
    document.head.appendChild(style);

    const enforceHttps = (url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol === 'http:') urlObj.protocol = 'https:';
            return urlObj.href;
        } catch(e) {
            return url;
        }
    };

    function ShowAnswers(answers) {
        const panel = document.createElement('div');
        panel.className = 'answers-panel';
        let html = '<div class="answers-list">'
        answers.forEach(answer => {
            html += `<div class="answer-item">${answer}</div>`
        })
        html += "</div>"
        panel.innerHTML = html
        document.body.appendChild(panel);
    }

    const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

    // Проверка наличия UUID в данных
    function containsUUID(data) {
        return data && UUID_REGEX.test(data);
    }
    // Перехват fetch
    const originalFetch = window.fetch;

    window.fetch = function(input, init) {
        const url = enforceHttps(typeof input === 'string' ? input : input.url);
        const body = init?.body;

        return originalFetch(input, init).then(response => {
            response.clone().text().then(responseText => {
                if (containsUUID(url) || containsUUID(body) || containsUUID(responseText)) {
                    if (url.indexOf("/exercises/api/v1/students/gateway_sessions/") === -1) {
                        return response;
                    }
                    let responseData;
                    try {
                        responseData = JSON.parse(responseText);
                    } catch (e) {
                        console.log('Ответов не будет');
                        return response;
                    }
                    console.log(responseData);
                    const keys = Object.keys(responseData.data.generation.data);

                    const answers = [];

                    keys.forEach(key => {
                        const value = responseData.data.generation.data[key].data.inputs.a.answers.a;
                        answers.push(value);
                    });

                    ShowAnswers(answers);
                    console.log('Найдены ответы');
                }
            });
            return response;
        });
    };

})();