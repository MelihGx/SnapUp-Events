"use strict";

const { Transform } = require("stream");

function uploadError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

function createUploadAuthorization({ verifyGuestToken, hashGuestToken, getGuestSecurity,
  getUploadStatusForEvent, assertRegisteredUserAccess }) {
  return async function authorizeUpload(req, res, next) {
    let claims;
    const token = String(req.get("x-guest-token") || "");
    try {
      claims = verifyGuestToken(token);
      if (claims.type !== "guest" || !claims.event_id || !claims.guest_id) throw new Error("Invalid claims");
    } catch (_) {
      return res.status(401).json({ success: false, message: "Guest session is invalid or expired.", code: "INVALID_GUEST_SESSION" });
    }
    try {
      const guest = await getGuestSecurity(claims.event_id, claims.guest_id);
      if (!guest || guest.guest_access_token_hash !== hashGuestToken(token)) {
        return res.status(401).json({ success: false, message: "Guest session has been revoked.", code: "GUEST_SESSION_REVOKED" });
      }
      const status = await getUploadStatusForEvent(claims.event_id);
      assertRegisteredUserAccess({ onlyUsers: status.onlyUsers, currentUser: req.user,
        guestSecurity: guest, guestClaims: claims });
      req.uploadIdentity = { eventId: String(claims.event_id), guestId: String(claims.guest_id) };
      next();
    } catch (error) {
      next(error);
    }
  };
}

// The request has one consumer: this bounded stream, which feeds Multer.
// Do not use pipeline(req, ...) here: its error handling destroys the HTTP
// socket before Express can send the controlled 413 response.
function runBoundedMultipart(req, res, parse, maxBytes, done) {
  let bytes = 0;
  let failure;
  let parsingFinished = false;
  const input = new Transform({
    transform(chunk, encoding, callback) {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        return callback(uploadError("The selected files must be 200 MB or smaller in total.", 413, "MEDIA_REQUEST_TOO_LARGE"));
      }
      callback(null, chunk);
    },
  });
  input.headers = req.headers;
  input.method = req.method;
  const abort = () => input.destroy(uploadError("Upload interrupted.", 400, "UPLOAD_INTERRUPTED"));
  const onClose = () => { if (!req.complete) abort(); };
  const onError = (error) => input.destroy(error);
  input.on("error", (error) => {
    failure = error;
    req.unpipe(input);
    req.pause();
  });
  req.once("aborted", abort);
  req.once("close", onClose);
  req.once("error", onError);
  parse(input, res, (error) => {
    parsingFinished = true;
    req.unpipe(input);
    req.removeListener("aborted", abort);
    req.removeListener("close", onClose);
    req.removeListener("error", onError);
    req.body = input.body;
    req.files = input.files;
    // Parser errors can leave unread bytes. Give an in-flight client a bounded
    // grace period to finish sending, without feeding any more bytes to Multer.
    // Immediate close with unread socket data can discard the 413 via TCP reset.
    // Never drain indefinitely (e.g. an endless chunked request).
    if ((error || failure) && !req.complete && !res.headersSent) {
      res.setHeader("Connection", "close");
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        req.removeListener("end", finish);
        req.removeListener("close", finish);
        req.pause();
        done(failure || error);
      };
      const timer = setTimeout(finish, 250);
      req.once("end", finish);
      req.once("close", finish);
      req.resume();
      return;
    }
    done(failure || error);
  });
  if (!input.destroyed && !parsingFinished) req.pipe(input);
}

function assertUploadIdentity(req) {
  const { event_id, guest_id } = req.body || {};
  if (typeof event_id !== "string" || typeof guest_id !== "string" ||
      event_id !== req.uploadIdentity?.eventId || guest_id !== req.uploadIdentity?.guestId) {
    throw uploadError("Guest session does not match this event.", 403, "GUEST_SESSION_MISMATCH");
  }
}

module.exports = { createUploadAuthorization, runBoundedMultipart, assertUploadIdentity };
