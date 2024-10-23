const { default: mongoose } = require("mongoose");
const faqRepository = require("../repositories/faq.repository");

class FAQController {

    #repo = {
        faqRepo: faqRepository
    };

    addPage = async(req,res)=>{
        try {
            return res.render("faq/views/add.ejs", {
                page_title: "ADD FAQ",
                page_name: "faq-management",
                user: req.user
            })
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    add = async(req,res)=>{
        try {
            req.body.question = req.body.question.trim();
            let existQuestion = await this.#repo.faqRepo.getByField({ question: req.body.question, isDeleted: false });
            if(existQuestion){
                req.flash("error", "This question already exist");
                return res.redirect(req.headers.referer);
            };
            let storeFAQ = await this.#repo.faqRepo.save(req.body);
            if(storeFAQ && storeFAQ._id){
                req.flash("success", "FAQ has been added successfully");
                return res.redirect("");
            }
            req.flash("error", "Something went wrong");
            return res.redirect(req.headers.referer);
        } catch (error) {
            return res.redirect(req.headers.referer);
        }
    }

    updatePage = async(req,res)=>{
        try {
            let faq = await this.#repo.faqRepo.getById(req.params.id);
            if(faq){
                return res.render("faq/views/update.ejs", {
                    page_title: "UPDATE FAQ",
                    page_name: "faq-management",
                    faq,
                    user: req.user
                })
            };
            req.flash("error", "This FAQ does not exist");
            return res.redirect(req.headers.referer);
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    update = async(req,res)=>{
        try {
            req.body.question = req.body.question.trim();
            let existFAQ = await this.#repo.faqRepo.getByField({ question: req.body.question, isDeleted: false, _id: { $ne: mongoose.Types.ObjectId(req.body.id) } });
            if(existFAQ){
                req.flash("error", "This question already exist");
                return req.redirect(req.headers.referer);
            };
            let updateFAQ = await this.#repo.faqRepo.updateById(mongoose.Types.ObjectId(req.body.id), req.body);
            if(updateFAQ && updateFAQ._id){
                req.flash("success", "FAQ updated successfully");
                return res.redirect("");
            }
            req.flash("error", "Something went wrong");
            return res.redirect(req.headers.referer);
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    delete = async(req,res)=>{
        try {
            let faq = await this.#repo.faqRepo.getById(req.params.id);
            if(!faq){
                req.flash("error", "This FAQ does not exist");
                return res.redirect(req.headers.referer);
            };
            await this.#repo.faqRepo.updateById(faq._id, { isDeleted: true });
            req.flash("success", "FAQ is deleted successfully");
            return res.redirect(req.headers.referer);
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    statusChange = async(req,res)=>{
        try {
            let faq = await this.#repo.faqRepo.getById(req.params.id);
            if(!faq){
                req.flash("error", "This FAQ does not exist");
                return res.redirect(req.headers.referer);
            };
            // if(faq.status == "Active"){
            //     await this.#repo.faqRepo.updateById(faq._id, { status: "Inactive" })
            // }else{
            //     await this.#repo.faqRepo.updateById(faq._id, { status: "Active" })
            // }
            let status = faq.status == 'Active'?"Inactive":"Active";
            await this.#repo.faqRepo.updateById(faq._id, {status});
            req.flash("success", "Changed status successfully");
            return res.redirect(req.headers.referer);
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

}

module.exports = new FAQController();