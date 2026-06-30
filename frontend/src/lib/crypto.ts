"use client";

function arrayBufferToBase64(buffer: Uint8Array): string {
	let binary = "";
	const len = buffer.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(buffer[i]);
	}
	return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
	const binaryString = window.atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

export async function encryptApiKey(
	apiKey: string,
	passphrase: string,
): Promise<string> {
	const encoder = new TextEncoder();
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	const iv = window.crypto.getRandomValues(new Uint8Array(12));

	const passwordKey = await window.crypto.subtle.importKey(
		"raw",
		encoder.encode(passphrase),
		{ name: "PBKDF2" },
		false,
		["deriveKey"],
	);

	const aesKey = await window.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as any,
			iterations: 100000,
			hash: "SHA-256",
		},
		passwordKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt"],
	);

	const ciphertext = await window.crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: iv as any,
		},
		aesKey,
		encoder.encode(apiKey),
	);

	const envelope = {
		salt: arrayBufferToBase64(salt),
		iv: arrayBufferToBase64(iv),
		ciphertext: arrayBufferToBase64(new Uint8Array(ciphertext)),
	};

	return window.btoa(JSON.stringify(envelope));
}

export async function decryptApiKey(
	encodedEnvelope: string,
	passphrase: string,
): Promise<string> {
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();

	const envelope = JSON.parse(window.atob(encodedEnvelope));
	const salt = base64ToArrayBuffer(envelope.salt);
	const iv = base64ToArrayBuffer(envelope.iv);
	const ciphertext = base64ToArrayBuffer(envelope.ciphertext);

	const passwordKey = await window.crypto.subtle.importKey(
		"raw",
		encoder.encode(passphrase),
		{ name: "PBKDF2" },
		false,
		["deriveKey"],
	);

	const aesKey = await window.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt as any,
			iterations: 100000,
			hash: "SHA-256",
		},
		passwordKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["decrypt"],
	);

	const decrypted = await window.crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: iv as any,
		},
		aesKey,
		ciphertext as any,
	);

	return decoder.decode(decrypted);
}
