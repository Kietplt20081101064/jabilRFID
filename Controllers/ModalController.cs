using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Jabil.Controllers
{ 
    
    public class ModalController : Controller
    {
        DBEntities db = new DBEntities();
        // GET: Modal
        public ActionResult Index()
        {
            return View();
        }
        public ActionResult ModalUser()
        {
            //ViewBag.PermissionList = db.Permissions.ToList();
            var permissionList = db.Permissions
                          .Where(p => p.PermisstionID != 8 && p.PermisstionID != 9 && p.PermisstionID != 10)
                          .ToList();
            ViewBag.PermissionList = permissionList;
            return PartialView();
        } 
        public ActionResult ModalFXReader()
        {
          
            return PartialView();
        } 
        public ActionResult ModalMachine()
        {
           
            return PartialView();
        }
        public ActionResult ModalCustomer()
        {
            return PartialView();
        }
        public ActionResult ModalSetting()
        {
            return PartialView();
        }
        public ActionResult ModalTagMapping() {
            return PartialView();
        } 
        public ActionResult ModalTagMappingMe() {
            return PartialView();
        } 
        public ActionResult ModalReport() {
            var machines = db.Records.Select(r => r.Machine).Distinct().ToList();
            var assembly = db.Records.Select(r => r.Assembly).Distinct().ToList();
            var setup = db.Records.Select(r => r.Setup).Distinct().ToList();
            var creatby = db.Records.Select(r => r.Owner).Distinct().ToList();
            var status = db.Records.Select(r => r.RecordType).Distinct().ToList();
            
            ViewBag.machines = machines;
            ViewBag.assembly = assembly;
            ViewBag.setup = setup;
            ViewBag.creatby = creatby;
            ViewBag.status = status;
            return PartialView();
        }
        public ActionResult ModalMachineMonitor()
        {
            var monitorMachines = db.Machines.Select(r => r.MachineInfo).Distinct().ToList();

            ViewBag.MonitorMachines = monitorMachines;
            return PartialView();
        }
    }
}