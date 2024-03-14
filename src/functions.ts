import { BASE_NODE_PORT } from "./config";
import { Value, NodeState } from "./types";

export function consensusStep1(messages: Value[], state: NodeState, N: number) {
  let count0 = messages.filter((el) => el === 0).length;
  let count1 = messages.filter((el) => el === 1).length;
  if (2 * count0 > N) {
    state.x = 0;
  }

  else if (2 * count1 > N) {
    state.x = 1;
  }
  else {
    state.x = "?";
  }
  return state.x;
}

export function consensusStep2(messsages: Value[], state: NodeState, F: number) {
  let count0 = messsages.filter((el) => el === 0).length;
  let count1 = messsages.filter((el) => el === 1).length;
  if (count0 > F) {
    state.decided = true;
    state.x = 0;
  }
  else if (count1 > F) {
    state.decided = true;
    state.x = 1;
  }
  else {
    if (count0 + count1 > 0 && count0 > count1) {
      state.x = 0;
    }
    else if (count0 + count1 > 0 && count1 > count0) {
      state.x = 1;
    }
    else {
      state.x = Math.floor(Math.random() * 2) ? 0 : 1;
    }
  }
  return state.x;
}

export function sendMessage(destinationNodeId: number, step: number, state: NodeState) {
  fetch(`http://localhost:${BASE_NODE_PORT + destinationNodeId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ x: state.x, k: state.k, step: step }),
  });
}

export function sendMessageToAll(step: number, state: NodeState, N: number) {
  for (let i = 0; i < N; i++) {
    sendMessage(i, step, state);
  }
}