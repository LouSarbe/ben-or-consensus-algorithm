"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.node = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const config_1 = require("../config");
async function node(nodeId, // the ID of the node
N, // total number of nodes in the network
F, // number of faulty nodes in the network
initialValue, // initial value of the node
isFaulty, // true if the node is faulty, false otherwise
nodesAreReady, // used to know if all nodes are ready to receive requests
setNodeIsReady // this should be called when the node is started and ready to receive requests
) {
    const node = (0, express_1.default)();
    node.use(express_1.default.json());
    node.use(body_parser_1.default.json());
    let state = {
        killed: false,
        x: initialValue,
        decided: false,
        k: 0
    };
    if (isFaulty) {
        state.x = null;
        state.decided = null;
        state.k = null;
    }
    let receivedMessages = [];
    // 1.
    // TODO implement this
    // this route allows retrieving the current status of the node
    node.get("/status", (req, res) => {
        if (isFaulty) {
            return res.status(500).send("faulty");
        }
        else {
            return res.status(200).send("live");
        }
    });
    // TODO implement this
    // get the current state of a node
    node.get("/getState", (req, res) => {
        return res.json(state);
    });
    // TODO implement this
    // this route allows the node to receive messages from other nodes
    node.post("/message", (req, res) => {
        if (isFaulty) {
            return res.status(500).send("faulty");
        }
        else {
            const message = req.body;
            receivedMessages.push(message);
            return res.send("success");
        }
    });
    // TODO implement this
    // this route is used to start the consensus algorithm
    node.get("/start", async (req, res) => {
        if (!nodesAreReady()) {
            return res.status(500).send("not all nodes are ready");
        }
        else {
            if (!isFaulty) {
                consensus();
            }
            return res.status(200).send("success");
        }
    });
    // TODO implement this
    // this route is used to stop the consensus algorithm
    node.get("/stop", async (req, res) => {
        state.killed = true;
        res.status(200).send("success");
    });
    function processMessagesStep1() {
        if (receivedMessages.length >= N - F) {
            // Sufficient messages received
            // Decide on a value based on received messages
            let count0 = 0;
            let count1 = 0;
            for (const message of receivedMessages) {
                if (message === 0) {
                    count0++;
                }
                if (message === 1) {
                    count1++;
                }
            }
            if (2 * count0 > N) {
                return 0;
            }
            if (2 * count1 > N) {
                return 1;
            }
            else {
                return -1;
            }
        }
        return null;
    }
    function processMessagesStep2() {
        if (receivedMessages.length >= N - F) {
            // Sufficient messages received
            // Decide on a value based on received messages
            let count0 = 0;
            let count1 = 0;
            for (const message of receivedMessages) {
                if (message === 0) {
                    count0++;
                }
                if (message === 1) {
                    count1++;
                }
            }
            if (count0 > F) {
                state.decided = true;
                return 0;
            }
            if (count1 > F) {
                state.decided = true;
                return 1;
            }
            else {
                if (count0 > 0) {
                    return 0;
                }
                if (count1 > 0) {
                    return 1;
                }
                else {
                    return Math.floor(Math.random() * 2);
                }
            }
        }
        return null;
    }
    // Function to initiate the consensus algorithm
    function consensus() {
        while (!state.decided && !state.killed) {
            if (state.k != null) {
                state.k = state.k + 1;
                receivedMessages = [];
            }
            for (let i = 0; i < N; i++) {
                if (i !== nodeId) {
                    sendMessage(i);
                }
            }
            let temp = null;
            while (temp === null && !state.killed) {
                temp = processMessagesStep1();
            }
            state.x = temp;
            receivedMessages = [];
            for (let i = 0; i < N; i++) {
                if (i !== nodeId) {
                    sendMessage(i);
                }
            }
            temp = null;
            while (temp === null && !state.killed) {
                temp = processMessagesStep2();
            }
            state.x = temp;
        }
    }
    function sendMessage(destinationNodeId) {
        fetch(`http://localhost:${config_1.BASE_NODE_PORT + destinationNodeId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(state.x),
        })
            .then(response => {
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            return response.json();
        });
    }
    // start the server
    const server = node.listen(config_1.BASE_NODE_PORT + nodeId, async () => {
        console.log(`Node ${nodeId} is listening on port ${config_1.BASE_NODE_PORT + nodeId}`);
        // the node is ready
        setNodeIsReady(nodeId);
    });
    return server;
}
exports.node = node;
