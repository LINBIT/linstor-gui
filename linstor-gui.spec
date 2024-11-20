%define debug_package %{nil}

Name: linstor-gui
Version: 1.8.6
Release: 1
Summary: GUI for LINSTOR
%global tarball_version %(echo "%{version}" | sed -e 's/~rc/-rc/' -e 's/~alpha/-alpha/')

License: GPL-3.0-or-later
URL: https://github.com/LINBIT/linstor-gui
Source0: %{name}-%{tarball_version}.tar.gz

Requires: linstor-controller >= 1.13.1
BuildArch: noarch

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
%doc README.md
%license COPYING


%changelog
* Wed Nov 20 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.8.6-1
- New upstream release

* Tue Nov 05 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.8.5-1
- New upstream release

* Tue Oct 22 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.8.4-1
- New upstream release

* Wed Oct 09 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.8.3-1
- New upstream release

* Thu Oct 03 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.8.2-1
- New upstream release

* Fri Sep 13 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.8.1-1
- New upstream release

* Thu Sep 12 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.8.0-1
- New upstream release

* Thu Sep 05 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.7-1
- New upstream release

* Tue Aug 27 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.6-1
- New upstream release

* Mon Aug 12 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.5-1
- New upstream release

* Mon Jul 22 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.4-1
- New upstream release

* Tue Jul 09 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.3-1
- New upstream release

* Mon Jul 08 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.2-1
-  New upstream release

* Wed Jun 19 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.1-1
-  New upstream release

* Mon Jun 17 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.0-1
-  New upstream release

* Tue Jun 04 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.7.0~rc.1-1
-  New upstream release

* Wed May 29 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.6.4-1
-  New upstream release

* Fri May 24 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.6.3-1
-  New upstream release

* Fri May 17 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.6.2-1
-  New upstream release

* Thu Apr 25 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.6.1-1
-  New upstream release

* Wed Mar 27 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.6.0-1
-  New upstream release

* Wed Feb 28 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.5.3-1
-  New upstream release

* Thu Feb 22 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.5.2-1
-  New upstream release

* Mon Feb 05 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.5.1-1
-  New upstream release

* Thu Jan 11 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.5.1~rc.1-1
-  New upstream release

* Thu Jan 11 2024 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.5.0-1
-  New upstream release

* Thu Nov 23 2023 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.5.0~rc.1-1
-  New upstream release

* Tue Aug 22 2023 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.4.0-1
-  New upstream release

* Mon Aug 07 2023 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.4.0~rc.3-1
-  New upstream release

* Thu Jul 20 2023 Roland Kammerer <roland.kammerer@linbit.com> - 1.4.0~rc.2-1
-  New upstream release

* Mon Jun 26 2023 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.4.0~rc.1-1
-  New upstream release

* Tue May 02 2023 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> - 1.3.0-1
-  New upstream release

* Wed Mar 29 2023 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> 1.3.0~rc.3-1
-  New upstream release

* Tue Feb 28 2023 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> 1.3.0~rc.2-1
-  New upstream release

* Wed Jan 25 2023 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> 1.3.0~rc.1-1
-  New upstream release

* Fri Dec 02 2022 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> 1.2.0-1
-  New upstream release

* Thu Nov 10 2022 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> 1.1.1-1
-  New upstream release

* Mon Oct 24 2022 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> 1.1.1~rc.1-1
-  New upstream release

* Wed Sep 14 2022 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> 1.1.0-1
-  New upstream release

* Thu Jul 07 2022 Roland Kammerer <roland.kammerer@linbit.com> 1.1.0~rc.3-1
-  New upstream release

* Thu Jun 09 2022 Roland Kammerer <roland.kammerer@linbit.com> 1.1.0~rc.2-1
-  New upstream release

* Thu May 05 2022 Christoph Böhmwalder <christoph.boehmwalder@linbit.com> 1.1.0~rc.1-1
-  New upstream release

* Tue Apr 26 2022 Roland Kammerer <roland.kammerer@linbit.com> 1.0.2-1
-  New upstream release

* Tue Mar 1 2022 Rene Peinthor <rene.peinthor@linbit.com> 1.0.1-1
-  New upstream release

* Mon Feb 28 2022 Rene Peinthor <rene.peinthor@linbit.com> 1.0.0-1
-  New upstream release

* Thu Jan 20 2022 Roland Kammerer <roland.kammerer@linbit.com> 1.0.0~rc.4-1
-  New upstream release

* Thu Dec 16 2021 Roland Kammerer <roland.kammerer@linbit.com> 1.0.0~rc.3-1
-  New upstream release

* Wed Nov 17 2021 Roland Kammerer <roland.kammerer@linbit.com> 1.0.0~rc.2-1
-  New upstream release

* Mon Nov 15 2021 Roland Kammerer <roland.kammerer@linbit.com> 1.0.0~rc.1-1
-  New upstream release
