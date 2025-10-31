const mongoose = require("mongoose");
const C = require("../../constants");

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
  console.log("wtf");
  if (this.isModified("content") && this.content) {
    const ciphertext = CryptoJS.AES.encrypt(this.content, SECRET_KEY).toString();
    console.log("Encrypted:", ciphertext);
    this.content = ciphertext;
  }
  next();
});


const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
