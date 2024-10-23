const express = require("express");
const router = express.Router();
const route_label = require("route-label");
const namedRouter = route_label(router);
const faqController = require("../../modules/faq/controllers/faq.controller");
const Auth = require("../../middleware/auth");

namedRouter.all("./faq", Auth.authenticate);

namedRouter.get("faq.add", '/faq/add', faqController.addPage);
namedRouter.post("faq.add", '/faq/add', faqController.add);
namedRouter.get("faq.update", '/faq/update/:id', faqController.updatePage);
namedRouter.post("faq.update", '/faq/update', faqController.update);
namedRouter.get("faq.delete", '/faq/delete/:id', faqController.delete);



module.exports = router;