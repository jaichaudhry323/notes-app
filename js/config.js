// ============================================================
// config.js — app configuration + shared runtime state
// Loaded first. Everything below is a global shared by the
// other modules (plain <script> files, no bundler).
// ============================================================

// ---- fill these in (see README) ----
var CLIENT_ID = '109086952966-dbhp0saakod184tpn1531ig82j84pon9.apps.googleusercontent.com';
var SPREADSHEET_ID = '1c1qNbfyagm2A1kSYODA8dr8TcAWGdZy2jaQLdRcAc2s';

// ---- constants ----
var SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
var API = 'https://sheets.googleapis.com/v4/spreadsheets/' + SPREADSHEET_ID;
var CARD_PREFIX = 'card_';
var TOKEN_KEY = 'focusboard_token';
var THEME_KEY = 'focusboard_theme';
var STALE_DAYS = 7; // days of no progress → card footer reads fully "stale"

// Metadata rows (A=key, B=value) in each card tab, in row order.
var META_KEYS = ['id','name','color','priority','hoursPerDay','tapCount','status','createdAt','lastProgress','emoji','description','favorite','category','tags','pinned'];

// ---- shared mutable state ----
var accessToken = null, tokenClient = null;
var cards = [];             // list of card meta objects (from loadCards)
var currentView = 'board';  // 'board' | 'analytics'
var currentFilter = 'active'; // 'active' | 'deleted'
var openCard = null;        // full data of the card open in the modal
var currentTab = 'overview'; // active tab inside the detail modal
