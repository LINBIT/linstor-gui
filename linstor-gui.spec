%define debug_package %{nil}

Name:		linstor-gui
Version:	0.1.2
Release:	1
Summary:	GUI for LINSTOR
%global	tarball_version %(echo "%{version}" | sed -e 's/~rc/-rc/' -e 's/~alpha/-alpha/')

License:	LINBIT-Proprietary
Source0:	%{name}-%{tarball_version}.tar.gz

Requires:	linstor-controller >= 1.13.1
BuildArch:	noarch

%description
Administration GUI for LINSTOR clusters.

%prep
%setup -q -n %{name}-%{tarball_version}


%build
echo "Nothing to build"


%install
make install DESTDIR=%{buildroot}


%files
/usr/share/linstor-server/ui


%changelog
* Tue Jul 27 2021 Roland Kammerer <roland.kammerer@linbit.com> 0.1.2-1
-  New upstream release

* Thu Jul 22 2021 Roland Kammerer <roland.kammerer@linbit.com> 0.1.1-1
-  New upstream release

* Thu Jul 15 2021 Philipp Reisner <philipp.reisner@linbit.com> 0.1.0-2
-  Make it as noarch

* Tue Jul 13 2021 Roland Kammerer <roland.kammerer@linbit.com> 0.1.0-1
-  New upstream release
