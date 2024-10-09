using Antlr.Runtime.Tree;
using Jabil.Extension;
using Jabil.Models;
using Microsoft.AspNet.SignalR.Hosting;
using NinjaNye.SearchExtensions;
using OfficeOpenXml.Style;
using OfficeOpenXml;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using static Jabil.Controllers.JabilAPIController;
using System.Drawing;

namespace Jabil.Controllers
{
    public class UserController : Controller
    {
        DBEntities db = new DBEntities();
        // GET: User
        public ActionResult Index()
        {
            return View();
        }

        public JsonResult GetUsers(int? page, string search)
        {
            try
            {
                var users = db.Accounts.Select(u => new
                {
                    EmployeeID = u.AccountID,
                    u.AccountName,
                    u.FullName,
                    Role = u.Role.RoleName,
                    u.CreateAt,
                    u.JabilID
                });
                //Phân trang
                int pageSize = 10;
                page = (page > 0) ? page : 1;
                int start = (int)(page - 1) * pageSize;

                if (!string.IsNullOrEmpty(search))
                {
                    users = users.Search(u => u.FullName.Trim().ToLower(),
                                         u => u.EmployeeID.ToString()
                    ).Containing(search);
                }

                var data = users;
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
            catch(Exception e)
            {
                return Json(new {status = false, message = e.Message }, JsonRequestBehavior.AllowGet);
            }
            
        }


        public JsonResult ListGroupsByUserId(int userid)
        {
            JsonResponse response = new JsonResponse();
            List<JabilUser> users = new List<JabilUser>();
            int count = 5;
            for(int i = 0; i < count; i++)
            {
                JabilUser user = new JabilUser($"User{i}",i,RandomString(3),RandomString(4));
                users.Add(user);
              
            }
            var searchUser = users.FirstOrDefault(u => u.UserId == userid);
            if(searchUser != null)
            {
                response.Status = true;
                response.Data = new { searchUser.UserId, searchUser.FirstName, searchUser.LastName };
            }
            else
            {
                response.Status = true;
                response.Message = "User is not valid";
            }
            return Json(response, JsonRequestBehavior.AllowGet);
        }
        public string RandomString(int length)
        {
            // creating a StringBuilder object()
            StringBuilder str_build = new StringBuilder();
            Random random = new Random();

            char letter;

            for (int i = 0; i < length; i++)
            {
                double flt = random.NextDouble();
                int shift = Convert.ToInt32(Math.Floor(25 * flt));
                letter = Convert.ToChar(shift + 65);
                str_build.Append(letter);
            }
           return str_build.ToString();
        }
        public JsonResult GetUserDetail(int UserID)
        {
            JsonResponse response = new JsonResponse();
            try
            {
                var account = db.Accounts.Find(UserID);
                if (account == null || UserID ==0) {
                    response.Status=false;
                    response.Message = "User is not exíst!";
                }
                else
                {
                    response.Status = true;
                    response.Data = new
                    {
                        account.AccountID,
                        account.FullName,
                        account.AccountName,
                        account.Role.RoleName,
                        account.RoleID,
                        Customers = account.CustomerOfUsers.Select(c => c.CusID).ToList(),
                        account.JabilID,
                        account.JabilID_ID
                        
                    };
                }
                return Json(response, JsonRequestBehavior.AllowGet);
            }
            catch(Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
                return Json(response, JsonRequestBehavior.AllowGet);
            }

        }
        public class FormData
        {
            public List<FormDataItem> formData { get; set; }
            public List<CustomerData> customerData { get; set; }
            public string UserID_ID { get; set; }
        }

        public class FormDataItem
        {
            public string name { get; set; }
            public string value { get; set; }
        }

        public class CustomerData
        {
            public string ID { get; set; }
            public string Name { get; set; }
        }
        [System.Web.Http.HttpPost]
        public JsonResult UpdateUser([FromBody] FormData data)
        {
            JsonResponse response = new JsonResponse();
            try
            {
                var UserID = data.formData.FirstOrDefault(f => f.name.Equals("JabilID")).value;
                var RoleID = data.formData.FirstOrDefault(f => f.name.Equals("Role")).value;
                var UserName = data.formData.FirstOrDefault(f => f.name.Equals("UserName")).value;
                var Customers = data.customerData;

                var account = db.Accounts.FirstOrDefault(a => a.JabilID.Equals(UserID));
                if (account == null || data == null)
                {
                    response.Status = false;
                    response.Message = "User is not exist!";
                }
                else
                {
                    account.AccountName= UserName;
                    account.RoleID = Int16.Parse(RoleID);
                    if (data.customerData == null)
                    {
                        response.Status = false;
                        response.Message = "Choose customer please!";
                        return Json(response, JsonRequestBehavior.AllowGet);
                    }
                    if(account.CustomerOfUsers.Count != data.customerData.Count())
                    {
                        account.CustomerID = null;
                    }
                    db.CustomerOfUsers.RemoveRange(account.CustomerOfUsers);
                    if (Customers != null )
                    {
                        foreach (var customer in Customers)
                        {
                            var cus = new CustomerOfUser
                            {
                                CusID = Int16.Parse(customer.ID),
                                CusName = customer.Name,
                            };
                            account.CustomerOfUsers.Add(cus);
                        }

                    }
                   
                    response.Status = true;
                    db.SaveChanges();
                }
                return Json(response, JsonRequestBehavior.AllowGet);
            }
            catch(Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
                return Json(response, JsonRequestBehavior.AllowGet);
            }
          
        } 
        [System.Web.Http.HttpPost]
        public JsonResult AddUser([FromBody] FormData data)
        {
            Account user = (Account)Session["account"];
            JsonResponse response = new JsonResponse();
            try
            {
                var UserID = data.formData.FirstOrDefault(f => f.name.Equals("JabilID")).value;
                var RoleID = data.formData.FirstOrDefault(f => f.name.Equals("Role")).value;
                var UserName = data.formData.FirstOrDefault(f => f.name.Equals("UserName")).value;
                var Customers = data.customerData;
                var UserID_ID = data.UserID_ID;
                if(db.Accounts.Any(a => a.JabilID.Equals(UserID)))
                {
                    response.Status = false;
                    response.Message = "ID already exists!";
                    return Json(response, JsonRequestBehavior.AllowGet);
                }

                if(string.IsNullOrEmpty(UserID_ID))
                {
                    response.Status = false;
                    response.Message = "User is not exist in MES!";
                    return Json(response, JsonRequestBehavior.AllowGet);
                }
                Account account = new Account
                {
                    JabilID = UserID,
                    RoleID = int.Parse(RoleID),
                    FullName = UserName,
                    JabilID_ID = UserID_ID,
                    CreateAt = DateTime.Now,
                    CreateBy = user.FullName
                };
              
                
                if (Customers != null)
                {
                    foreach (var customer in Customers)
                    {
                        var cus = new CustomerOfUser
                        {
                            CusID = Int16.Parse(customer.ID),
                            CusName = customer.Name,
                        };
                        account.CustomerOfUsers.Add(cus);
                    }
                }
                else
                {
                    response.Status = false;
                    response.Message = "Choose customer please!";
                    return Json(response, JsonRequestBehavior.AllowGet);
                }
               
                response.Status = true;
                db.Accounts.Add(account);
                db.SaveChanges();


                return Json(response, JsonRequestBehavior.AllowGet);
            }
            catch(Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
                return Json(response, JsonRequestBehavior.AllowGet);
            }
          
        }
        [System.Web.Http.HttpPost]
        public JsonResult DeleteUser(string UserID)
        {
            JsonResponse response = new JsonResponse();
            try
            {
                var account = db.Accounts.FirstOrDefault(a => a.JabilID.Equals(UserID));
                if (account == null || string.IsNullOrEmpty(UserID))
                {
                    response.Status = false;
                    response.Message = "User is not exíst!";
                }
                else
                {
                  
                    db.CustomerOfUsers.RemoveRange(account.CustomerOfUsers);
                    db.Accounts.Remove(account);
                    response.Status = true;
                    db.SaveChanges();
                }
                return Json(response, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        } 
        [System.Web.Http.HttpPost]
        public JsonResult SetCustomerForUser(int UserID, int CustomerID)
        {
            JsonResponse response = new JsonResponse();
            try
            {
                var account = db.Accounts.Find(UserID);
                if (account == null || UserID == 0)
                {
                    response.Status = false;
                    response.Message = "User is not exíst!";
                }
                else
                {
                   var isCustomerValid = account.CustomerOfUsers.Any(r => r.CusID ==CustomerID);
                    if (isCustomerValid)
                    {
                        account.CustomerID = CustomerID;
                        response.Status = true;
                        db.SaveChanges();
                        Session["User"] = account;
                    }
                    else
                    {
                        response.Status = false;
                        response.Message = "Can't choose this customer! Please reload page and try again!";
                    }
                   
                }
                return Json(response, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        public void ExportUsers()
        {
            try
            {
                var result = db.Accounts.Select(a => new
                {
                    a.JabilID,
                    a.FullName,
                    
                    a.Role.RoleName,
                    a.CreateAt,
                    a.CreateBy
                }).ToList();

                if (result.Count() > 0)
                {
                    ExcelPackage ep = new ExcelPackage();
                    ExcelWorksheet Sheet = ep.Workbook.Worksheets.Add("Report");
                    Sheet.Cells["A1"].Value = "UserID";
                    Sheet.Cells["B1"].Value = "User Name";
                    Sheet.Cells["C1"].Value = "Role";
                    Sheet.Cells["D1"].Value = "Create At";
                    Sheet.Cells["E1"].Value = "Create By";

                    int row = 2;// dòng bắt đầu ghi dữ liệu
                    foreach (var item in result)
                    {
                        Sheet.Cells[string.Format("A{0}", row)].Value = item.JabilID;
                        Sheet.Cells[string.Format("B{0}", row)].Value = item.FullName;
                        Sheet.Cells[string.Format("C{0}", row)].Value = item.RoleName;
                        Sheet.Cells[string.Format("D{0}", row)].Value = item.CreateAt.Value.ToString("dd/MM/yyyy");
                        Sheet.Cells[string.Format("E{0}", row)].Value = item.CreateBy;
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

                    Response.AddHeader("content-disposition", "attachment; filename=" + "User_Report_" + d + ".xlsx");
                    Response.BinaryWrite(ep.GetAsByteArray());
                    Response.End();


                }
            }
            catch (Exception ex)
            {
                var message = ex.Message;
            }

        }

    }
}