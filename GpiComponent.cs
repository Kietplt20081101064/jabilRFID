using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace Jabil
{
    public class GpiComponent
    {
        //Thay đổi mỗi khi đóng mở cover(bảng LiveGPI) 
        DBEntities db = new DBEntities();
        string ReaderID;
        public void RegisterNotification(string readerID)
        {
            try
            {
                ReaderID = readerID;
                string conStr = ConfigurationManager.ConnectionStrings["sqlConString"].ConnectionString;
                string sqlCommand = @"SELECT [GPI]
                                      ,[Status] 
                                      ,[FXReader]
                                  FROM [dbo].[LiveGPI] WHERE [FXReader] = @ReaderID";
                //you can notice here I have added table name like this [dbo].[Contacts] with [dbo], its mendatory when you use Sql Dependency
                using (SqlConnection con = new SqlConnection(conStr))
                {
                    SqlCommand cmd = new SqlCommand(sqlCommand, con);
                    cmd.Parameters.AddWithValue("@ReaderID", readerID);
                    if (con.State != System.Data.ConnectionState.Open)
                    {
                        con.Open();
                    }
                    cmd.Notification = null;
                    SqlDependency sqlDep = new SqlDependency(cmd);
                    sqlDep.OnChange += sqlDep_OnChange;
                    //we must have to execute the command here
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        // nothing need to add here now
                    }
                }
            }catch(Exception e)
            {

            }
           
        }

        private void sqlDep_OnChange(object sender, SqlNotificationEventArgs e)
        {
            if (e.Type == SqlNotificationType.Change)
            {
                //SqlDependency sqlDep = sender as SqlDependency;
                //sqlDep.OnChange -= RequestsqlDep_OnChange;
               
                //from here we will send notification message to client
                //var gpiHub = GlobalHost.ConnectionManager.GetHubContext<GpiHub>();
                //var stt = GetGPIStt();
                //gpiHub.Clients.All.notify(stt);
                ////re-register notification
                //RegisterNotification(ReaderID);
            }
        }
       protected bool GetGPIStt() {
            var gpi = db.LiveGPIs.FirstOrDefault(g => g.FXReader.Equals(ReaderID));
            return (bool)gpi.Status ;
        }

    }
}