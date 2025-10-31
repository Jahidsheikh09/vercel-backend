const mongoose = require("mongoose");
const C = require("../../constants");
const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.MESSAGE_SECRET_KEY;

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const MediaSchema = new mongoose.Schema(
  {
    url: String,
    mime: String,
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    chat: { type: ObjectId, ref: "Chat", required, index: true },
    sender: { type: ObjectId, ref: "User", required, index: true },
    content: { type: String, default: "" },
    media: [MediaSchema],
    status: { type: Map, of: String }, // userId -> 'sent'|'delivered'|'seen'
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

MessageSchema.index({ chat: 1, createdAt: -1 });

MessageSchema.pre("save", { document: true, query: false }, function (next) {
  try {
    if (this.isModified("content") && this.content && SECRET_KEY) {
      const ciphertext = CryptoJS.AES.encrypt(this.content, SECRET_KEY).toString();
      this.content = ciphertext;
    }
  } catch (e) {
    // If encryption fails, proceed without blocking save in dev
  }
  next();
});

// // Static method to decrypt message content
// MessageSchema.statics.decryptContent = function (encryptedContent) {
//   if (!encryptedContent || !SECRET_KEY) return encryptedContent || "";
//   try {
//     const bytes = CryptoJS.AES.decrypt(encryptedContent, SECRET_KEY);
//     const decrypted = bytes.toString(CryptoJS.enc.Utf8);
//     // If decryption fails, return original (might be unencrypted)
//     return decrypted || encryptedContent;
//   } catch (e) {
//     // If decryption fails, assume content is not encrypted
//     return encryptedContent;
//   }
// };

// // Instance method to decrypt this message's content
// MessageSchema.methods.getDecryptedContent = function () {
//   return Message.decryptContent(this.content);
// };

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
