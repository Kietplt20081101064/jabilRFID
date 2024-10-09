using Jabil.Extension;
using Jabil.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Script.Serialization;

namespace Jabil.Controllers
{
    public class SettingController : Controller
    {
        // GET: Setting
        public ActionResult Index()
        {
            return View();
        }
       
       
        [HttpGet]
        public JsonResult GetSettingData()
        {
            try
            {
                return Json(new {status = true, data = SettingDataHelper.GetDataFile() }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = $"Error: {ex.Message}" }, JsonRequestBehavior.AllowGet);
            }
            
        }
        [HttpPost]
        public JsonResult SetSettingData(SettingData settingData)
        {
            try
            {
                SettingDataHelper.SetDataFile(settingData);
                return Json(new { status = true},JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = $"Error: {ex.Message}" }, JsonRequestBehavior.AllowGet);
            }
            
        }

        
    }
}