using Jabil.Controllers;
using Microsoft.AspNet.SignalR.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;


namespace Jabil.Extension
{
    public class JabilAPI
    {
        public class Token
        {
            public string accessToken { get; set; }
            public string tokenType { get; set; }
            public object refreshToken { get; set; }
            public object idToken { get; set; }
            public int expiresIn { get; set; }
        }

        public async Task GetTokenAsync()
        {
            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Post, "https://vnhcmc0app81.corp.jabil.org/MESProxyWebAPI/api/Auth/Token");
            var content = new StringContent("{\r\n  \"identificationId\": \"4992d402-8797-4d08-8b22-0bf880cddb80\",\r\n  \"secretKey\": \"LH3kVOJccScRk3Uen6P7ZL6dBLPnK9P4\"\r\n}", null, "application/json");
            request.Content = content;
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();
            
            var jsonData = await response.Content.ReadAsStringAsync();
            Token token = JsonSerializer.Deserialize<Token>(jsonData);
            HomeController home = new HomeController();
            home.SaveSession(token.accessToken);
           
        }
    }
}