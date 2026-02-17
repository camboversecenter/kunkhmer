
import { PeerData } from "../types";

// Declare global PeerJS type (loaded via script tag)
declare class Peer {
    constructor(id?: string, options?: any);
    on(event: string, callback: (data: any) => void): void;
    connect(id: string): any;
    destroy(): void;
    id: string;
}

let peer: Peer | null = null;
let connections: any[] = []; // Array to hold multiple connections (for Spectator mode)

export const initializePeer = (
    onOpen: (id: string) => void,
    onConnection: (conn: any) => void,
    onData: (data: PeerData, connId: string) => void,
    onError: (err: any) => void
) => {
    if (peer) destroyPeer();

    // Create a random ID for the host
    peer = new Peer(undefined, {
        debug: 2
    });

    peer.on('open', (id: string) => {
        console.log('My Peer ID is: ' + id);
        onOpen(id);
    });

    peer.on('connection', (conn: any) => {
        console.log('Incoming connection...', conn.peer);
        
        conn.on('open', () => {
            console.log('Connection fully open:', conn.peer);
            connections.push(conn);
            onConnection(conn);
        });

        conn.on('data', (data: PeerData) => {
            // Pass the connection ID so we know who sent it
            onData(data, conn.peer);
        });

        conn.on('close', () => {
            console.log('Connection closed:', conn.peer);
            connections = connections.filter(c => c.peer !== conn.peer);
        });
        
        conn.on('error', (err: any) => console.error('Connection error:', err));
    });

    peer.on('error', (err: any) => {
        console.error('PeerJS Error:', err);
        onError(err);
    });
};

export const connectToPeer = (
    hostId: string,
    onOpen: () => void,
    onData: (data: PeerData, peerId: string) => void,
    onError: (err: any) => void
) => {
    if (peer) destroyPeer();

    peer = new Peer();

    peer.on('open', () => {
        const conn = peer!.connect(hostId);
        
        conn.on('open', () => {
            console.log("Connected to host!");
            connections.push(conn);
            
            conn.on('data', (data: PeerData) => {
                onData(data, conn.peer);
            });
            
            onOpen();
        });

        conn.on('error', (err: any) => onError(err));
    });

    peer.on('error', (err: any) => onError(err));
};

export const sendData = (data: PeerData) => {
    connections.forEach(conn => {
        if (conn.open) {
            conn.send(data);
        }
    });
};

export const sendToPeer = (peerId: string, data: PeerData) => {
    const conn = connections.find(c => c.peer === peerId);
    if (conn && conn.open) {
        conn.send(data);
    }
};

export const destroyPeer = () => {
    connections.forEach(c => c.close());
    connections = [];
    
    if (peer) {
        peer.destroy();
    }
    peer = null;
};
