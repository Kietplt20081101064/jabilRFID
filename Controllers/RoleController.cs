using Jabil.Extension;
using Jabil.Models;
using NinjaNye.SearchExtensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Jabil.Controllers
{
    public class RoleController : Controller
    {
        DBEntities db = new DBEntities();
        // GET: Role
        public ActionResult Index()
        {
            return View();
        }
        [HttpPost]
        public JsonResult ModifyRole(FormCollection collection)
        {
            try
            {
                string checkbox = collection["PermissionCheckbox"];
                string rolename = collection["RoleName"];
                string des = collection["Description"];
                int roleID = string.IsNullOrEmpty(collection["RoleID"]) ? 0 : Int16.Parse(collection["RoleID"]);
                if (string.IsNullOrEmpty(rolename) || string.IsNullOrEmpty(des))
                {
                    // Xuất thông báo lỗi nếu rỗng
                    return Json(new { status = false, message = "Data is not valid!" }, JsonRequestBehavior.AllowGet);

                }
                List<Permission> pers = new List<Permission>();
                if (!string.IsNullOrEmpty(checkbox))
                {
                    var stringRoles = checkbox.Split(',');
                    foreach (string strRole in stringRoles)
                    {
                        var per = db.Permissions.Find(int.Parse(strRole));
                        if (per != null)
                            pers.Add(per);
                    }
                }
                var oldRole = db.Roles.Find(roleID);

                if (oldRole != null)
                {
                    // Nếu Role đã tồn tại, cập nhật thông tin 
                    oldRole.RoleName = rolename;
                    oldRole.Description = des;
                    oldRole.Permissions.Clear();
                    oldRole.Permissions = pers;
                }
                else
                {
                    // Nếu Role chưa tồn tại, thêm mới vào cơ sở dữ liệu
                    var newRole = new Role {
                        RoleName = rolename,
                        Description = des,
                        Permissions = pers,
                    };
                    db.Roles.Add(newRole);
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
        public JsonResult DeleteRole(int id)
        {
            try
            {
                var role = db.Roles.FirstOrDefault(x => x.RoleID == id);
                if (role != null)
                {
                    role.Permissions.Clear();
                    db.Roles.Remove(role);
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
        [HttpGet]
        public JsonResult GetRoles(string search, int page)
        {
            var list = db.Roles.Select(f => new {
                f.RoleID,
                f.RoleName,
                Description = f.Description.Trim(),
                f.CreateAt,
                f.ModifyAt,
                CreateBy = f.CreateBy.Trim(),
                ModifyBy = f.ModifyBy.Trim()
            });


            if (!string.IsNullOrEmpty(search))
            {
                list = list.Search(x => x.RoleName,
                                  x => x.Description)
                                  .Containing(search);

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
        [HttpPost]
        public JsonResult GetRoleDetail(int RoleID)
        {
            try
            {
                var role = db.Roles.Find(RoleID);
                if (role == null)
                {
                    return Json(new { status = false, message = "Role does not exist" }, JsonRequestBehavior.AllowGet);
                }



                return Json(new { status = true, data = new {
                    role.RoleID,
                    role.RoleName,
                    role.Description,
                    Permissions = role.Permissions?.Select(p => new
                    {
                        p.PermissionName,
                        p.PermisstionID

                    }),
                } }, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }


        public JsonResult GetRolesList()
        {
            JsonResponse response = new JsonResponse();
            try
            {
                var data = db.Roles.Select(r => new
                {
                   ID = r.RoleID,
                   Name = r.RoleName,
                });

                if (!data.Any())
                {
                    response.Status = false;
                    response.Message = "Don't have any Role value";
                }
                else
                {
                    response.Status = true;
                    response.Data = data;
                }
                   


            }catch(Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
            }
            return Json(response, JsonRequestBehavior.AllowGet);
        }
    }

}