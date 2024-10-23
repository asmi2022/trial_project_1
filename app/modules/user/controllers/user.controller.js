const UserRepo = require("../repositories/user.repository");
const helper = require("../../../utils/helper.cjs");
const RoleRepo = require("../../role/repositories/role.repository");
const otp_generator = require("otp-generator");
const moment = require("moment");
const mailer = require("../../../utils/mailer");
const JWT = require("jsonwebtoken");
const named_router = require("route-label")(require("express"));

class UserController {

    #repo = {UserRepo, RoleRepo};

    signInPage = async(req,res)=>{
        try {
            if (req.session && req.session.token) {
                return res.redirect(named_router.urlFor('user.dashboard'));
            }
            return res.render("user/views/signin.ejs", {
                page_title: "SIGN IN",
                page_name: "user-management"
            });
        } catch (error) {
            console.log(error, "error");

            req.flash("error", error.message);
            return res.redirect("/");
        }
    }

    signIn = async(req,res)=>{
        try {
            console.log(req.body);
            
            let role = await this.#repo.RoleRepo.getByField({role: "Admin"});
            req.body.email = req.body.email.trim().toLowerCase();
            let user = await this.#repo.UserRepo.getByField({email: req.body.email, isDeleted: false, role: role._id});
            if(!user){
                req.flash("error", "This user does not exist");
                return res.redirect(req.headers.referer);
            };
            if(!(await helper.comparePassword(req.body.password, user.password))){
                req.flash("error", "Incorrect password");
                console.log("Incorrect password");
                
                return res.redirect(req.headers.referer);
            }
            let token = JWT.sign({id: user._id}, process.env.JWT_SECRET, {
                expiresIn: "1h"
            });

            req.session.token = token;
            
            // res.cookie("auth_token", token);
            req.flash("success", "Signed in successfully");
            return res.redirect(named_router.urlFor("user.dashboard"));
        } catch (error) {
            console.log(error, "error");
            
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    dashboardPage = async(req,res)=>{
        try {
            console.log(63);
            
            return res.render("user/views/dashboard.ejs", {
                page_title: "DASHBOARD",
                page_name: "user-management",
                user: req.user
            });
        } catch (error) {
            console.error(error);
            
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    forgetPasswordPage = async(req,res)=>{
        try {
            return res.render("user/views/forgetpassword.ejs", {
                page_title: "FORGET PASSWORD",
                page_name: "user-management",
            });
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    forgetPassword = async(req,res)=>{
        try {
            req.body.email = req.body.email.trim().toLowerCase();
            let role = await this.#repo.RoleRepo.getByField({ role: "Admin" });
            let user = await this.#repo.UserRepo.getByField({ email: req.body.email, isDeleted: false, role: role._id, status: "Active" });
            if(!user){
                req.flash("error", "User does not exist");
                return res.redirect(req.headers.referer);
            };
            let otp = await otp_generator.generate(6, {
                digits: true,
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false
            });
            let exp_otp = new Date(moment().add(5, "minutes").format());
            // req.body.password = await helper.generateHash("1234567");
            let updateu = await this.#repo.UserRepo.updateById(user._id, { otp, exp_otp });
            console.log(updateu);
            if(updateu && updateu._id){
                console.log(otp, "otp");
                
                mailer.sendMail(
                    updateu.email, 
                    "OTP FOR RESET PASSWORD", //subject
                    `
                    <p>Hello ${updateu.name},</p><br>
                    <p>The otp to reset your password is ${otp}, will be valid for next 5 minutes.</p><br>
                    Thank you!
                    `
                )
                console.log(updateu.otp, "update");
                
                req.flash("success", "Please check your email");
                
                return res.redirect(named_router.urlFor("user.otp_verification.page", {id: updateu._id}));
            };
            req.flash("error", "Something went wrong");
            return res.redirect(req.headers.referer);
        } catch (error) {
            console.error(error);
            
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    // modal
    otpVerificationPage = async(req,res)=>{
        try {
            let user = await this.#repo.UserRepo.getById(req.params.id);
            
            return res.render("user/views/otpverification.ejs", {
                page_title: "OTP VERIFICATION",
                page_name: "user-management",
                user
            });
        } catch (error) {
            console.error(error);
            
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    otpVerification = async(req,res)=>{
        try {
            let user = await this.#repo.UserRepo.getById(req.body.id);
            if(!user){
                req.flash("error", "User does not exist");
                return res.redirect(req.headers.referer);
            };
            
            if((req.body.otp == user.otp) && (moment().isBefore(user.exp_otp))){
                req.flash("success", "Verified successfully");
                return res.redirect(named_router.urlFor("user.reset_password.page", {id: user._id}));
            }
            req.flash("error", "Incorrect otp or timed out");   //2to error likhbo na
            return res.redirect(req.headers.referer);
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    resetPasswordPage = async(req,res)=>{
        try {
            let user = await this.#repo.UserRepo.getById(req.params.id);
            return res.render("user/views/resetpassword.ejs", {
                page_title: "RESET PASSWORD",
                page_name: "user-management",
                user
            });
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    resetPassword = async(req,res)=>{
        try {
            let user = await this.#repo.UserRepo.getById(req.body.id);
            req.body.password = await helper.generateHash(req.body.password);
            let update = await this.#repo.UserRepo.updateById(user._id, { password: req.body.password });
            if(update && update._id){
                req.flash("success", "Password updated successfully");
                return res.redirect(named_router.urlFor("user.signin.page"));
            }
            req.flash("error", "Something went wrong");
            return res.redirect(req.headers.referer);
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    changePasswordPage = async(req,res)=>{
        try {
            return res.render("user/views/changepassword.ejs", {
                page_title: "CHANGE PASSWORD",
                page_name: "user-management",
                user: req.user
            });
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    changePassword = async(req,res)=>{
        try {
            console.log(req.body);
            let user = await this.#repo.UserRepo.getById(req.body.id);
            if(!user){
                req.flash("error", "User does not exist");
                return res.redirect(req.headers.referer);
            }
            if(!(await helper.comparePassword(req.body.oldPassword, user.password))){
                req.flash("error", "Incorrect password");
                return res.redirect(req.headers.referer);
            }
            req.body.password = await helper.generateHash(req.body.password_updated);
            let update = await this.#repo.UserRepo.updateById(user._id, {password: req.body.password});
            
            if(update && update._id){
                req.flash("success", "Password has been changed successfully");
                return res.redirect(req.headers.referer);
            }
            req.flash("error", "Something went wrong");
            return res.redirect(req.headers.referer);
        } catch (error) {
            req.flash("error", error.message);
            return res.redirect(req.headers.referer);
        }
    }

    logOut = async(req,res)=>{
        try {
            console.log('logout')
            res.clearCookie("auth_token");
            req.session.destroy((error)=>{
                return res.redirect("/");    
            });
        } catch (error) {
            console.error(error);
            
            req.flash("error", error.message);
            return res.redirect("/");
        }
    }
}

module.exports = new UserController();