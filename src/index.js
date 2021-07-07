import * as axios from 'axios';
import * as core from '@actions/core';
import * as github from '@actions/github';

const trelloApiKey = core.getInput('trello-api-key', { required: true });
const trelloAuthToken = core.getInput('trello-auth-token', { required: true });
const trelloBoardId = core.getInput('trello-board-id', { required: true });

function getCardNumber(input) {
    const ids = input && input.length > 0 ? input.match(/\#\d+/g) : [];
    if (!ids || ids.length === 0) {
        return null;
    }
    return ids[ids.length - 1].replace('#', '');
}

async function getAttachments(cardId) {
    return await axios.get(`https://api.trello.com/1/cards/${cardId}/attachments`, {
        params: {
            key: trelloApiKey,
            token: trelloAuthToken
        },
    }).then(response => {
        return response.data;
    })
}

async function addAttachmentToCard(card, name, link) {
    let url = `https://api.trello.com/1/cards/${card}/attachments`;

    return await axios.post(url, {
        key: trelloApiKey,
        token: trelloAuthToken,
        url: link,
        name: name,
    }).then(response => {
        return response.status === 200;
    }).catch(error => {
        console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
        return null;
    });
}

async function getCardOnBoard(board, cardId) {
    const url = `https://trello.com/1/boards/${board}/cards/${cardId}`

    return await axios.get(url, {
        params: {
            key: trelloApiKey,
            token: trelloAuthToken
        }
    }).then(response => {
        return response.data.id;
    }).catch(error => {
        console.error(url, `Error ${error.response.status} ${error.response.statusText}`);
        return null;
    });
}

async function doesCardHaveAttachment(cardId, name, url) {
    const attachments = await getAttachments(cardId);
    core.info(JSON.stringify(attachments));

    for (const attachment of attachments) {
        if (attachment.name === name && attachment.url === url) {
            return true;
        }
    }

    return false
}

async function getBranch() {
    const branchName = github.context.ref.replace('refs/heads/', '');
    const repoName = github.context.repo.owner + '/' + github.context.repo.repo;

    return {
        name: branchName,
        url: github.context.serverUrl + '/' + repoName + '/tree/' + branchName,
    }
}

async function getPullRequest() {
    return {
        name: github.context.payload.pull_request.title,
        url: github.context.payload.pull_request.html_url,
    }
}

async function run() {
    let ref = null;

    if (github.context.eventName === 'pull_request') {
        ref = github.context.payload.pull_request.head.ref;
    }

    if (github.context.eventName === 'push') {
        ref = github.context.ref;
    }

    const cardNumber = getCardNumber(ref);
    if (!cardNumber) {
        return;
    }

    const cardId = await getCardOnBoard(trelloBoardId, cardNumber);
    if (!cardId) {
        return;
    }

    let entity = null;

    if (github.context.eventName === 'pull_request') {
        entity = await getPullRequest();
    }

    if (github.context.eventName === 'push') {
        entity = await getBranch();
    }

    if (!entity) {
        return;
    }

    const cardAttachmentExists = await doesCardHaveAttachment(cardId, entity.name, entity.url);
    if (cardAttachmentExists) {
        return;
    }

    await addAttachmentToCard(cardId, entity.name, entity.url);
}

run();
