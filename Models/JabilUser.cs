using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Jabil.Models
{
    public class JabilUser
    {
       
        public string UserID_ID {get; set;}
        public int UserId {get; set;}
        public string LastName {get; set;}
        public string FirstName {get; set;}

        public JabilUser(string userID_ID, int userId, string lastName, string firstName)
        {
            UserID_ID = userID_ID;
            UserId = userId;
            LastName = lastName;
            FirstName = firstName;
        }
    }

}