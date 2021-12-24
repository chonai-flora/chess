const CANVAS = 720;
const BLOCK = CANVAS / 8;

const P = 1;
const N = 2;
const B = 3;
const R = 4;
const Q = 5;
const K = 6;

let board;
let placable;
let x, y;
let emoji;
let turn;
let gameStatus;

// EnPassant
let epWX, epWY;
let epBX, epBY;

// Promotion
let pSelect;
let pFlag;

// Castling
let wOO, bOO;	// King Side
let wOOO, bOOO;	// Queen Side

// Check
let checkedPieces;
let isChecking;

const isEmpty = (list) => list.every((e) => e === 0);

const isOutOfRange = (x, y) => (x < 0 || y >= 8 || x >= 8 || y < 0);

function tmp() {

	isChecked();
}

function gameInit() {
	board = [
		[-R, -N, -B, -Q, -K, -B, -N, -R],
		[-P, -P, -P, -P, -P, -P, -P, -P],
		[00, 00, 00, 00, 00, 00, 00, 00],
		[00, 00, 00, 00, 00, 00, 00, 00],
		[00, 00, 00, 00, 00, 00, 00, 00],
		[00, 00, 00, 00, 00, 00, 00, 00],
		[+P, +P, +P, +P, +P, +P, +P, +P],
		[+R, +N, +B, +Q, +K, +B, +N, +R],
	];
	initPlacable();
	emoji = [
		'♚', '♛', '♜', '♝', '♞', '♟', '',
		'♙', '♘', '♗', '♖', '♕', '♔',
	];
	turn = +1;
	gameStatus = true;
	epWX = epWY = epBX = epBY = 8;

	pSelect = [];
	pFlag = false;

	wOO = bOO = wOOO = bOOO = true;

	checkedPieces = [];
	isChecking = false;

	let message = createP("※開発途中です チェックメイト判定等を実装中です");
	message.position(0, CANVAS + BLOCK);
	message.style("font-size", "18px");

	redraw();
}

function setup() {
	createCanvas(CANVAS, CANVAS + BLOCK);
	textAlign(LEFT, TOP);
	angleMode(DEGREES);
	noStroke();
	noLoop();
	gameInit();
}

function draw() {
	background('white');
	fill('black');
	textSize(35);

	if (!gameStatus) {
		text(emoji[K * (-turn) + 6] + "の勝ちです", 5, 5);
	}
	else if (isCheckmated()) { }
	else {
		let message = (isChecked() ? "チェックされています" : "");
		let sign = pSelect[0] !== undefined ? -turn : turn;
		text(emoji[K * sign + 6] + "のターンです\n" + message, 5, 5);
	}

	translate(0, BLOCK);
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			fill((i + j) % 2 === 0 ? 'snow' : 'lightgrey');
			if (placable[j][i] === 2) fill('silver');
			square(BLOCK * i, BLOCK * j, BLOCK);
			if (placable[j][i] === 1) {
				fill('silver');
				circle(BLOCK * i + BLOCK / 2, BLOCK * j + BLOCK / 2, BLOCK / 2);
			}
			fill('black');
			textSize(BLOCK);
			text(emoji[board[j][i] + 6], BLOCK * i, BLOCK * j);

			textSize(15);
			if (i === 0) {
				text(j, i * BLOCK + 5, j * BLOCK + 5);
			}
			if (j === 7) {
				text(char('a'.charCodeAt(0) + i), i * BLOCK + 75, j * BLOCK + 70);
			}
		}
	}

	if (board[7][4] !== +K) wOO = wOOO = false;
	else if (board[0][4] !== -K) bOO = bOOO = false;
	else if (board[7][7] !== +R) wOO = false;
	else if (board[0][7] !== -R) bOO = false;
	else if (board[7][0] !== +R) wOOO = false;
	else if (board[0][0] !== -R) bOOO = false;
}

function initPlacable() {
	x = y = 0;
	placable = Array(8).fill(0).map(() => Array(8).fill(0));
}

function updatePlacable(r, c) {
	initPlacable();

	let piece = board[c][r];
	let sign = Math.sign(piece);

	// P
	if (abs(piece) === P) {
		if (board[c - sign][r] === 0)
			placable[c - sign][r] = 1;
		if (Math.sign(board[c - sign][r - sign]) === -sign)
			placable[c - sign][r - sign] = 1;
		if (Math.sign(board[c - sign][r + sign]) === -sign)
			placable[c - sign][r + sign] = 1;

		if (sign > 0 && c === 6 &&
			isEmpty([board[c - 1][r], board[c - 2][r]])) {
			placable[c - 2][r] = 1;
			epWX = r; epWY = c - 2;
		}
		if (sign < 0 && c === 1 &&
			isEmpty([board[c + 1][r], board[c + 2][r]])) {
			placable[c + 2][r] = 1;
			epBX = r; epBY = c + 2;
		}

		if (abs(r - epWX) === 1 && epWY === c) {
			placable[epWY + 1][epWX] = 1;
		}
		if (abs(r - epBX) === 1 && epBY === c) {
			placable[epBY - 1][epBX] = 1;
		}
	}

	// N
	else if (abs(piece) === N) {
		for (let angle = 30; angle < 360 + 30; angle += 45) {
			let p = round(2 * cos(angle)) + r;
			let q = round(2 * sin(angle)) + c;

			if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) continue;
			placable[q][p] = 1;
		}
	}

	// B
	else if (abs(piece) === B) {
		for (let angle = 45; angle < 360 + 45; angle += 90) {
			for (let radius = 1; radius < floor(8 * sqrt(2.0)); radius++) {
				let p = round(radius * cos(angle)) + r;
				let q = round(radius * sin(angle)) + c;

				if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) break;
				placable[q][p] = 1;
				if (Math.sign(board[q][p]) !== 0) break;
			}
		}
	}

	// R
	else if (abs(piece) === R) {
		for (let angle = 0; angle < 360; angle += 90) {
			for (let radius = 1; radius < 8; radius++) {
				let p = round(radius * cos(angle)) + r;
				let q = round(radius * sin(angle)) + c;

				if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) break;
				placable[q][p] = 1;
				if (Math.sign(board[q][p]) !== 0) break;
			}
		}
	}

	// Q
	else if (abs(piece) === Q) {
		for (let angle = 0; angle < 360; angle += 45) {
			for (let radius = 1; radius < floor(8 * sqrt(2.0)); radius++) {
				let p = round(radius * cos(angle)) + r;
				let q = round(radius * sin(angle)) + c;

				if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) break;
				placable[q][p] = 1;
				if (Math.sign(board[q][p]) !== 0) break;
			}
		}
	}

	// K
	else if (abs(piece) === K) {
		for (let angle = 0; angle < 360; angle += 45) {
			let p = round(cos(angle)) + r;
			let q = round(sin(angle)) + c;

			if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) continue;
			placable[q][p] = 1;
		}

		if (wOO && isEmpty([board[7][5], board[7][6]]))
			placable[7][7] = 1;
		if (wOOO && isEmpty([board[7][1], board[7][2], board[7][3]]))
			placable[7][0] = 1;
		if (bOO && isEmpty([board[0][5], board[0][6]]))
			placable[0][7] = 1;
		if (bOOO && isEmpty([board[0][1], board[0][2], board[0][3]]))
			placable[0][0] = 1;
	}

	x = r; y = c;
	placable[y][x] = 2;
}

function checkPiece(r, c) {
	let piece = board[c][r];
	let sign = Math.sign(piece);

	if (abs(piece) === P) {
		if (c + 1 < 0 || c + 1 >= 8 || c - 1 < 0 || c - 1 >= 8) return;

		// if (board[c - sign][r] === 0)
		// 	checkedPieces.push(abs(board[c - sign][r]));
		// if (board[c + sign][r] === 7)
		// 	checkedPieces.push(abs(board[c + sign][r]));
		if (Math.sign(board[c - sign][r - sign]) === -sign)
			checkedPieces.push(abs(board[c - sign][r - sign]));
		if (Math.sign(board[c - sign][r + sign]) === -sign)
			checkedPieces.push(abs(board[c - sign][r + sign]));
	}

	else if (abs(piece) === N) {
		for (let angle = 30; angle < 360 + 30; angle += 45) {
			let p = round(2 * cos(angle)) + r;
			let q = round(2 * sin(angle)) + c;

			if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) continue;
			checkedPieces.push(abs(board[q][p]));
		}
	}

	else if (abs(piece) === B) {
		for (let angle = 45; angle < 360 + 45; angle += 90) {
			for (let radius = 1; radius < floor(8 * sqrt(2.0)); radius++) {
				let p = round(radius * cos(angle)) + r;
				let q = round(radius * sin(angle)) + c;

				if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) break;
				checkedPieces.push(abs(board[q][p]));
				if (Math.sign(board[q][p]) !== 0) break;
			}
		}
	}

	else if (abs(piece) === R) {
		for (let angle = 0; angle < 360; angle += 90) {
			for (let radius = 1; radius < 8; radius++) {
				let p = round(radius * cos(angle)) + r;
				let q = round(radius * sin(angle)) + c;

				if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) break;
				checkedPieces.push(abs(board[q][p]));
				if (Math.sign(board[q][p]) !== 0) break;
			}
		}
	}

	else if (abs(piece) === Q) {
		for (let angle = 0; angle < 360; angle += 45) {
			for (let radius = 1; radius < floor(8 * sqrt(2.0)); radius++) {
				let p = round(radius * cos(angle)) + r;
				let q = round(radius * sin(angle)) + c;

				if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) break;
				checkedPieces.push(abs(board[q][p]));
				if (Math.sign(board[q][p]) !== 0) break;
			}
		}
	}

	else if (abs(piece) === K) {
		for (let angle = 0; angle < 360; angle += 45) {
			let p = round(cos(angle)) + r;
			let q = round(sin(angle)) + c;

			if (isOutOfRange(p, q) || Math.sign(board[q][p]) === sign) continue;
			checkedPieces.push(abs(board[q][p]));
		}
	}
}

function isChecked(opponent = -turn) {
	isChecking = true;
	checkedPieces = [];

	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			if (Math.sign(board[j][i]) === opponent) {
				checkPiece(i, j);
			}
		}
	}

	isChecking = false;
	return checkedPieces.includes(K);
}

function isCheckmated() {
	return false;
}

function mousePressed() {
	if (!gameStatus) return;
	if (pSelect[0] !== undefined && !(emoji.includes(pSelect[0].value()))) return;

	let p = floor(mouseX / BLOCK);
	let q = floor((mouseY - BLOCK) / BLOCK);
	if (isOutOfRange(p, q)) return;

	if (turn === +1 && wOO && p === 7 && q === 7 &&
		isEmpty([board[7][5], board[7][6]])) {
		board[7][6] = +K; board[7][5] = +R;
		board[7][4] = board[7][7] = 0;
		wOO = wOOO = false;
	}
	if (turn === +1 && wOOO && p === 0 && q === 7 &&
		isEmpty([board[7][1], board[7][2], board[7][3]])) {
		board[7][2] = +K; board[7][3] = +R;
		board[7][0] = board[7][1] = board[7][4] = 0;
		wOO = wOOO = false;
	}
	if (turn === -1 && bOO && p === 7 && q === 0 &&
		isEmpty([board[0][5], board[0][6]])) {
		board[0][6] = -K; board[0][5] = -R;
		board[0][4] = board[0][7] = 0;
		bOO = bOOO = false;
	}
	if (turn === -1 && bOOO && p === 0 && q === 0 &&
		isEmpty([board[0][1], board[0][2], board[0][3]])) {
		board[0][2] = -K; board[0][3] = -R;
		board[0][0] = board[0][1] = board[0][4] = 0;
		bOO = bOOO = false;
	}

	if (board[q][p] !== 0 &&
		Math.sign(board[q][p]) === Math.sign(turn)) {
		updatePlacable(p, q);
		redraw();
	}

	if (placable[q][p] === 1) {
		if (p === epWX && q === epWY + 1 &&
			abs(board[y][x]) === P) {
			board[epWY][epWX] = 0;
			epWX = epWY = 8;
		}
		if (p === epBX && q === epBY - 1 &&
			abs(board[y][x]) === P) {
			board[epBY][epBX] = 0;
			epBX = epBY = 8;
		}

		if (turn > 0) epBX = epBY = 8;
		if (turn < 0) epWX = epWY = 8;

		if (!isChecking) {
			board[q][p] = board[y][x];
			board[y][x] = 0;
		}

		if ((board[q][p] === +P && q === 0) ||
			(board[q][p] === -P && q === 7)) {
			pFlag = true;
		}

		turn = -turn;
		initPlacable();
		redraw();
	}

	if (pFlag) {
		let sign = Math.sign(board[q][p]);
		pSelect[0] = createSelect();
		pSelect[0].position(BLOCK * p, sign < 0 ? BLOCK * 8 : BLOCK);
		pSelect[0].size(BLOCK, BLOCK);
		pSelect[0].style('font-size', '45px');
		pSelect[0].option('-');
		for (let i = N; i < K; i++) {
			pSelect[0].option(emoji[i * sign + 6]);
		}
		redraw();
		pSelect[0].changed(() => {
			let item = pSelect[0].value();
			let val = 0;
			if (item === emoji[N * sign + 6]) val = N;
			else if (item === emoji[B * sign + 6]) val = B;
			else if (item === emoji[R * sign + 6]) val = R;
			else if (item === emoji[Q * sign + 6]) val = Q;
			board[q][p] = val * sign;
			pSelect[0].remove();
			pSelect = [];
			redraw();
		});
		pFlag = false;
	}
}