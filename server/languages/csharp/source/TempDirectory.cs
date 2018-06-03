using System;
using System.IO;

namespace language_csharp
{
	public class TempDirectory : IDisposable
	{
		bool disposed = false;
		private string dir = null;
		
		public TempDirectory()
		{
			//Generate a unique path that doesn't already exist
			while (this.dir == null || Directory.Exists(this.dir) == true) {
				this.dir = this.generatePath();
			}
			
			Directory.CreateDirectory(this.dir);
		}
		
		public string getPath() {
			return this.dir;
		}
		
		private string generatePath() {
			return Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
		}
		
		public void Dispose()
		{
			Dispose(true);
			GC.SuppressFinalize(this);
		}
		
		protected virtual void Dispose(bool disposing)
		{
			if (disposed == true) {
				return;
			}
			
			if (disposing == true)
			{
				Directory.Delete(this.dir, true);
				disposed = true;
			}
		}
	}
}
