using Jabil.Extension;
using Microsoft.Ajax.Utilities;
using NinjaNye.SearchExtensions;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data.Entity.Migrations;
using System.Linq;
using System.Net.Http.Formatting;
using System.Web;
using System.Web.Mvc;
using System.Web.UI;

namespace Jabil.Controllers
{
    public class FXReaderController : Controller
    {
        DBEntities db = new DBEntities();
        // GET: FXReader
        public ActionResult Index()
        {
            return View();
        }
       

        [HttpPost]
        public JsonResult ModifyReader(FormCollection collection)
        {
            try
            {
                Account user = (Account)Session["account"];
                //Tao Machine
                int? machineID = null;
                Machine machine = new Machine();
                if (string.IsNullOrEmpty(collection["MachineID"]))
                {
                    machineID = null;
                }
                else
                {
                    machineID = int.Parse(collection["MachineID"].ToString());
                    if(!db.Machines.Any(m => m.MachineID == machineID))
                    {
                        machine = new Machine
                        {
                            MachineID = (int)machineID,
                            MachineInfo = collection["MachineInfo"],
                            CreateAt = DateTime.Now,
                            
                        };
                        db.Machines.Add(machine);
                    }
                    else
                    {
                        machine = db.Machines.Find(machineID);
                        if (machine.FXReaders.Any() && machine.FXReaders.FirstOrDefault().FXReaderID != collection["FXReaderID"]) { 
                            return Json(new { status = false, message = $"Machine is connected with Reader: {machine.FXReaders.FirstOrDefault().FXReaderID}. Please try again!" }, JsonRequestBehavior.AllowGet);
                        }
                    }
                }
                db.SaveChanges();
                //Tao reader
                string AuthCode = Base64Extension.Base64Encode($"{collection["FXReaderUser"]}:{collection["FXReaderPassword"]}");
                FXReader reader = new FXReader
                {
                    FXReaderID = collection["FXReaderID"],
                    FXReaderName = collection["FXReaderName"],
                    IPAddress = collection["IPAddress"],  
                    AuthorizationCode = AuthCode,
                    CreateAt = DateTime.Now,
                    CreateBy = user.FullName

                };
                if (string.IsNullOrEmpty(reader.FXReaderID) || string.IsNullOrEmpty(reader.IPAddress))
                {
                    // Xuất thông báo lỗi nếu FXReaderID hoặc IPAddress rỗng
                    return Json(new { status = false, message = "Data is not valid!" }, JsonRequestBehavior.AllowGet);

                }
                var oldReader = db.FXReaders.FirstOrDefault(r => r.FXReaderID ==reader.FXReaderID);
                
                if (oldReader != null)
                {
                    // Nếu FXReader đã tồn tại, cập nhật thông tin IPAddress
                    oldReader.IPAddress = reader.IPAddress;
                    oldReader.MachineID = machineID;
                    oldReader.AuthorizationCode = AuthCode;
                    oldReader.ModifyAt = DateTime.Now;
                    oldReader.ModifyBy = user.FullName;
                }
                else
                {
                    // Nếu FXReader chưa tồn tại, thêm mới vào cơ sở dữ liệu
                    reader.MachineID = machineID;
                    db.FXReaders.Add(reader);
                   
                }


                db.SaveChanges();

                return Json(new { status = true }, JsonRequestBehavior.AllowGet);

            }   
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DeleteReader(string id)
        {
            try
            {
                var reader = db.FXReaders.Where(x => x.FXReaderID == id).FirstOrDefault();
                if (reader != null)
                {
                    db.FXReaders.Remove(reader);
                    db.SaveChanges();
                    return Json(new { status = true }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { status = false, message = "Reader does not exist!" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        } 
        [HttpPost]
        public JsonResult UnmapReader(string id)
        {
            try
            {
                var reader = db.FXReaders.Where(x => x.FXReaderID == id).FirstOrDefault();
                if (reader != null)
                {
                    reader.MachineID = null;
                    db.SaveChanges();
                    return Json(new { status = true }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { status = false, message = "Reader does not exist!" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        public JsonResult GetFX(string search, int page)
        {
            var list = db.FXReaders.Select(f =>new {
                FXReaderID=  f.FXReaderID.Trim(),
                FXReaderName =  f.FXReaderName.Trim(),
                IPAddress= f.IPAddress.Trim(),
                f.MachineID,
                MachineInfo = f.Machine != null? f.Machine.MachineInfo:"Unmatch to Machine",
                f.CreateAt,
                f.ModifyAt,
                CreateBy = f.CreateBy.Trim(),
                ModifyBy = f.ModifyBy.Trim(),
                AuthorizationCode = string.IsNullOrEmpty(f.AuthorizationCode) ? string.Empty : f.AuthorizationCode,
            });
            if (!string.IsNullOrEmpty(search))
            {
                list = list.Search(x => x.FXReaderID.ToLower(),
                                   x => x.FXReaderName.ToLower(),
                                   x => x.IPAddress.ToLower(),
                                   x => x.MachineInfo).Containing(search.ToLower());
            }
            //Phân trang
            int pageSize = 10;
            page = (page > 0) ? page : 1;
            int start = (int)(page - 1) * pageSize;
            var data = list;
            ViewBag.pageCurrent = page;
            int totalBill = data.Count();
            float totalNumsize = (totalBill / (float)pageSize);

            int numSize = (int)Math.Ceiling(totalNumsize);
            ViewBag.numSize = numSize;
            data = data.OrderByDescending(d => d.CreateAt).Skip(start).Take(pageSize);

            var fromto = PaginationExtension.FromTo(totalBill, (int)page, pageSize);

            int from = fromto.Item1;
            int to = fromto.Item2;
            return this.Json(
          new
          {
              data,
              pageCurrent = page,
              numSize,
              total = totalBill,
              size = pageSize,
              from,
              to

          }
          , JsonRequestBehavior.AllowGet
          );


        
        }
        public JsonResult GetFXList()
        {
            var list = db.FXReaders.Select(f =>new {
                FXReaderID=  f.FXReaderID.Trim(),
                IPAddress= f.IPAddress.Trim(),
                FXReaderName= f.FXReaderName.Trim(),
                f.CreateAt,
                f.ModifyAt,
                CreateBy = f.CreateBy.Trim(),
                ModifyBy = f.ModifyBy.Trim()
            });

            return this.Json(
            new
            {
                Status = true,
                Data = list,


            }
          , JsonRequestBehavior.AllowGet
          ) ;


        
        }
        
    }
}