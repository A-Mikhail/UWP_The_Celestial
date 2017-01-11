using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium.Appium.iOS;
using OpenQA.Selenium.Remote;

namespace UnitTest_TheCelestial
{
    [TestClass]
    public class UnitTest1
    {
        protected const string WindowsApplicationDriverUrl = "http://127.0.0.1:4723";
        public static RemoteWebElement ApplicationResult;
        public static IOSDriver<IOSElement> ApplicationSession;

        [ClassInitialize]
        public static void Setup(TestContext context)
        {
            DesiredCapabilities appCapabilities = new DesiredCapabilities();
            // Id of application to test (find inside appxmanifest Identity Name="")
            appCapabilities.SetCapability("app", "51a830d1-e9e2-4a20-8a05-d547bfb2fc1c_z0qgta0qgdq0p!App");
            ApplicationSession = new IOSDriver<IOSElement>(new Uri(WindowsApplicationDriverUrl), appCapabilities);
            Assert.IsNotNull(ApplicationSession);
        }

        [ClassCleanup]
        public static void TearDown()
        {
            ApplicationResult = null;
            ApplicationSession.Dispose();
            ApplicationResult = null;
        }

        [TestMethod]
        public void AddFiles()
        {
            ApplicationSession.FindElementByName(" Settings").Click();
            ApplicationSession.FindElementByName("General").Click();
            System.Threading.Thread.Sleep(1000);
            ApplicationSession.FindElementByName("Delete").Click();
            ApplicationSession.FindElementByName("Close").Click();
            System.Threading.Thread.Sleep(1000);

            ApplicationSession.FindElementByName("Pick Files").Click();

            System.Threading.Thread.Sleep(2000); // Wait for 2 second until the dialog comes up
            var openFileBox = ApplicationSession.FindElementByClassName("#32770");

            openFileBox.FindElementByClassName("Edit").Click();
            openFileBox.FindElementByClassName("Edit").SendKeys("D:\\Mikhail\\Programming\\BackupApp\\TestFilePicker\\D\\D3.jpg" + OpenQA.Selenium.Keys.Enter);

            System.Threading.Thread.Sleep(1000); // Wait for 1 second until the dialog comes up        
        }
    }
}
