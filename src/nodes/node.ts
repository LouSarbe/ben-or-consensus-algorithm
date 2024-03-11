import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { BASE_NODE_PORT } from "../config";
import { Value, NodeState } from "../types";

export async function node(
  nodeId: number, // the ID of the node
  N: number, // total number of nodes in the network
  F: number, // number of faulty nodes in the network
  initialValue: Value, // initial value of the node
  isFaulty: boolean, // true if the node is faulty, false otherwise
  nodesAreReady: () => boolean, // used to know if all nodes are ready to receive requests
  setNodeIsReady: (index: number) => void // this should be called when the node is started and ready to receive requests
) {
  const node = express();
  node.use(express.json());
  node.use(bodyParser.json());

  let state: NodeState = {
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

  let receivedMessages: number[] = [];

  // 1.
  // TODO implement this
  // this route allows retrieving the current status of the node
  node.get("/status", (req, res) => {
    if (isFaulty) {
      return res.status(500).send("faulty");
    } else {
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
  node.post("/message", (req: Request, res: Response) => {
    if(isFaulty) {
      return res.status(500).send("faulty");
    } else{
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
    } else {
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
        if (count0 > 0)
        {
          return 0;
        }
        if (count1 > 0)
        {
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
    while(!state.decided && !state.killed) {
      if (state.k != null){
        state.k = state.k + 1;
        receivedMessages = [];
      }
      for (let i = 0; i < N; i++) {
        if (i !== nodeId) {
          sendMessage(i);
        }
      }
      let temp: any = null;
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

function sendMessage(destinationNodeId: number) {
  fetch(`http://localhost:${BASE_NODE_PORT + destinationNodeId}/message`, {
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
  })
  /*.then(data => {
    console.log('Message sent successfully');
  })
  .catch(error => {
    console.error('Error sending message:', error);
  })*/;
}

  

  // start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );

    // the node is ready
    setNodeIsReady(nodeId);
  });

  return server;
}
