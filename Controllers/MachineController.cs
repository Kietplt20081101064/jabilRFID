using Jabil.Extension;
using Jabil.Models;
using Microsoft.Ajax.Utilities;
using NinjaNye.SearchExtensions;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;
using System.Web.Http.Results;
using System.Web.Mvc;
using static Jabil.Controllers.JabilAPIController;

namespace Jabil.Controllers
{
    public class MachineController : Controller
    {
        DBEntities db = new DBEntities();
        // GET: Machine
        public ActionResult Index()
        {
            return View();
        }
        [HttpGet]
        public JsonResult GetCustomerMachine(int customerID, string search, int page)
        {
            JsonResponse response = new JsonResponse();
            try
            {
                var list = db.MachineOfCustomers.Where(m => m.CusID == customerID).Select(r => new
                {
                    ID = r.MachineID,
                    Name = r.Machine.MachineInfo,
                    
                    FXReaderName = r.Machine.FXReaders.Any()?r.Machine.FXReaders.FirstOrDefault().FXReaderName.Trim(): "Unmatch to FXReader",
                    IPAddress = r.Machine.FXReaders.Any() ? r.Machine.FXReaders.FirstOrDefault().IPAddress.Trim() : "Unmatch to FXReader",
                    r.Machine.CreateAt
                });
                if (!string.IsNullOrEmpty(search))
                {
                    list = list.Search(x => x.Name.ToLower(),
                        x => x.FXReaderName.ToLower(),
                        x => x.IPAddress.ToLower()
                        ).Containing(search.ToLower());
                }

                //Phân trang
                int pageSize = 10;
                page = (page > 0) ? page : 1;
                int start = (int)(page - 1) * pageSize;
                var data = list;
                ViewBag.pageCurrent = page;
                int total = data.Count();
                float totalNumsize = (total / (float)pageSize);

                int numSize = (int)Math.Ceiling(totalNumsize);
                ViewBag.numSize = numSize;
                data = data.OrderByDescending(d => d.CreateAt).Skip(start).Take(pageSize);

                var fromto = PaginationExtension.FromTo(total, (int)page, pageSize);

                int from = fromto.Item1;
                int to = fromto.Item2;
                return this.Json(
              new
              {
                  Status = true,
                  data,
                  pageCurrent = page,
                  numSize,
                  total,
                  size = pageSize,
                  from,
                  to

              }
              , JsonRequestBehavior.AllowGet
              );
                
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
                return Json(response, JsonRequestBehavior.AllowGet);
            }
            
        }

       
        [HttpPost]
        public JsonResult AddMachineToCustomer(FormCollection collection)
        {
            Account user = (Account)Session["account"];
            var response =  new JsonResponse();
            try
            {
                int? machineID = null;
                Machine machine = new Machine();
                if (string.IsNullOrEmpty(collection["MachineID"]) || string.IsNullOrEmpty(collection["CusID"]))
                {
                    response.Status = false;
                    response.Message = "Data is not valid!";
                } 
                machineID = int.Parse(collection["MachineID"]);
                if(db.Machines.Any(m => m.MachineID == machineID))
                {
                    machine = db.Machines.FirstOrDefault(m => m.MachineID == machineID);
                }
                else
                {
                    machine = new Machine
                    {
                        MachineID = (int)machineID,
                        MachineInfo = collection["MachineInfo"],
                        CreateAt = DateTime.Now,
                        CreateBy = user.FullName
                    };
                    db.Machines.Add(machine);
                    db.SaveChanges();
                }
                int cusID = int.Parse(collection["CusID"]);
                 
                if (db.MachineOfCustomers.Any(r => r.MachineID == machine.MachineID && r.CusID == cusID))
                {
                    response.Status = false;
                    response.Message = "The customer already has this machine!";
                }
                else
                {
                    var machineOfCus = new MachineOfCustomer
                    {
                        CusID = cusID,
                        MachineID = (int)machineID,
                        CusName = collection["CusName"]
                    };
                    db.MachineOfCustomers.Add(machineOfCus);
                    db.SaveChanges();
                    response.Status = true;
                }
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
            }
            return Json(response, JsonRequestBehavior.AllowGet);
        }
        [HttpPost]
        public JsonResult DeleteMachineToCustomer(int machineID, int customerID)
        {
            Account user = (Account)Session["account"];
            var response = new JsonResponse();
            try
            {
                if (machineID == 0 || customerID == 0)
                {
                    response.Status = false;
                    response.Message = "Data is not valid!";
                }
                else
                {
                   var machine = db.MachineOfCustomers.FirstOrDefault(x => x.MachineID == machineID && x.CusID == customerID);
                    if(machine == null)
                    {
                        response.Status = false;
                        response.Message = "Data is not valid!";
                    }
                    else
                    {
                        db.MachineOfCustomers.Remove(machine);
                        db.SaveChanges();
                        response.Status = true;
                    }
                   
                }


            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
            }
            return Json(response, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetMachineOfCustomer(int CustomerID)
        {
           
            var response = new JsonResponse();
            try
            {
                var data = db.MachineOfCustomers.Where(m => m.CusID == CustomerID).Select(
                    m => new
                    {
                        m.CusID,
                        m.CusName,
                        m.Machine.MachineInfo,
                        m.MachineID
                    }).ToList();
               
                response.Status = true;
                response.Data = data;

            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
            }
            return Json(response, JsonRequestBehavior.AllowGet);
        }
        public void ExportMachines()
        {
            try
            {
                var result = db.FXReaders.Select(f => new
                {
                    f.FXReaderID,
                    f.FXReaderName,
                    f.MachineID,
                    Machine = f.MachineID != null ? f.Machine:null,
                    f.CreateAt,
                    f.CreateBy
                }).ToList();

                if (result.Count() > 0)
                {
                    ExcelPackage ep = new ExcelPackage();
                    ExcelWorksheet Sheet = ep.Workbook.Worksheets.Add("Report");
                    Sheet.Cells["A1"].Value = "FXReader ID";
                    Sheet.Cells["B1"].Value = "FXReader Name";
                    Sheet.Cells["C1"].Value = "Machine";
                    Sheet.Cells["D1"].Value = "Customers of machine";
                    Sheet.Cells["E1"].Value = "Create At";
                    Sheet.Cells["F1"].Value = "Create By";

                    int row = 2;// dòng bắt đầu ghi dữ liệu
                    foreach (var item in result)
                    {
                        Sheet.Cells[string.Format("A{0}", row)].Value = item.FXReaderID;
                        Sheet.Cells[string.Format("B{0}", row)].Value = item.FXReaderName;
                        Sheet.Cells[string.Format("C{0}", row)].Value = item.Machine != null? item.Machine.MachineInfo: "Unmatch to any Machine";
                        Sheet.Cells[string.Format("D{0}", row)].Value = item.Machine != null ? string.Join(",", item.Machine.MachineOfCustomers.Select(m => m.CusName)) : "Unmatch to any Customer";
                        Sheet.Cells[string.Format("E{0}", row)].Value = item.CreateAt.Value.ToString("dd/MM/yyyy");
                        Sheet.Cells[string.Format("F{0}", row)].Value = item.CreateBy;
                        row++;
                    }
                    Sheet.Cells["A:AZ"].AutoFitColumns();

                    // Select only the header cells
                    var headerCells = Sheet.Cells[1, 1, 1, Sheet.Dimension.Columns];
                    Sheet.View.FreezePanes(2, 1);
                    headerCells.AutoFilter = true;
                    // Set their text to bold, italic and underline.
                    headerCells.Style.Font.Bold = true;
                    headerCells.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    headerCells.Style.Font.Color.SetColor(Color.White);
                    headerCells.Style.Fill.BackgroundColor.SetColor(Color.Blue);
                    headerCells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    Response.Clear();
                    Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    string d = DateTime.Today.ToString("dd.MM.yy");

                    Response.AddHeader("content-disposition", "attachment; filename=" + "Machine_Report_" + d + ".xlsx");
                    Response.BinaryWrite(ep.GetAsByteArray());
                    Response.End();


                }
            }catch(Exception ex)
            {
               var message=  ex.Message;
            }
           
        }
        [HttpGet]
        public JsonResult GetMachineMonitor(string search, string machine )
        {
            var response = new JsonResponse();
            try
            {
                var query = db.Machines.AsQueryable();

                // Lọc theo các tiêu chí tìm kiếm
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(r => r.MachineInfo.Contains(search));
                }

                if (!string.IsNullOrEmpty(machine))
                {
                    query = query.Where(r => r.MachineInfo.Contains(machine));
                }

                // Bạn có thể thêm các tiêu chí lọc khác tương tự như trên

                var data = query.ToList().Select(r => new {
                    r.MachineInfo,
                    lastRecord = GetLastRecord(r.MachineInfo) == null ? "No Data" : GetLastRecord(r.MachineInfo).Datetime.Value.ToString("dd/MM/yyyy hh:mm tt"),
                    lastStt = GetLastRecord(r.MachineInfo) == null ? "No Data" : CreateLastRecord(GetLastRecord(r.MachineInfo)),
                }).ToList();

                if (data.Any())
                {
                    response.Status = true;
                    response.Data = data;
                }
                else
                {
                    response.Status = false;
                    response.Message = "There are nothing to show";
                }
            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
            }
            return Json(response, JsonRequestBehavior.AllowGet);
        }
        //[HttpGet]
        //public JsonResult GetMachineMonitor()
        //{

        //    var response = new JsonResponse();
        //    try
        //    {

        //        var data = db.Machines.ToList().Select(r => new {
        //                r.MachineInfo,
        //                lastRecord = GetLastRecord(r.MachineInfo) == null ? "No Data" : GetLastRecord(r.MachineInfo).Datetime.Value.ToString("dd/MM/yyyy hh:mm tt"),
        //                lastStt = GetLastRecord(r.MachineInfo) == null ? "No Data"  : CreateLastRecord(GetLastRecord(r.MachineInfo)),
        //            }).ToList();




        //        if (data.Any())
        //        {
        //            response.Status = true;
        //            response.Data = data;
        //        }
        //        else
        //        {
        //            response.Status = false;
        //            response.Message = "There are nothing to show";
        //        }

        //    }
        //    catch (Exception ex)
        //    {
        //        response.Status = false;
        //        response.Message = ex.Message;
        //    }
        //    return Json(response, JsonRequestBehavior.AllowGet);
        //}
        public  Record GetLastRecord(string MachineInfo)
        {
            var lastRecord = db.Records.OrderByDescending(r => r.Datetime).FirstOrDefault(r => r.Machine.Equals(MachineInfo));
            return lastRecord;
        }
        public string CreateLastRecord(Record lastRecord)
        {
            TimeSpan time = DateTime.Now - lastRecord.Datetime.Value;

            if (time.TotalMinutes < 30)
            {
                if (time.TotalMinutes < 2 || lastRecord.RecordType == "Success")
                {
                    return "Running";
                }
                else if (lastRecord.RecordType == "Fail") // Kiểm tra trạng thái Fail
                {
                    return "Fail";
                }
                else
                {
                    return lastRecord.RecordType;
                }
            }
            else
            {
                return "Stop";
            }
        }
        //public string CreateLastRecord(Record lastRecord)
        //{

        //    TimeSpan time = DateTime.Now - lastRecord.Datetime.Value;
        //    if(time.TotalMinutes < 30)
        //    {
        //        if (time.TotalMinutes < 2 || lastRecord.RecordType =="Success")
        //        {
        //            return "Running";
        //        }
        //        else 
        //        {
        //            return lastRecord.RecordType;
        //        }


        //    }
        //    else
        //    {
        //        return "Stop";
        //    }


        //}


        [HttpPost]
        public JsonResult SetCurrentMachine(int ID)
        {
            var machine = db.Machines.Find(ID);
            Session["Machine"] = machine;
            var FX = machine.FXReaders.FirstOrDefault();
            if (FX != null)
            {
                return Json(new { Status = true }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { Status = false, Message = "Machine is not map to any FXReader! Please select machine again!" }, JsonRequestBehavior.AllowGet);
            }
        }
    }
}
    