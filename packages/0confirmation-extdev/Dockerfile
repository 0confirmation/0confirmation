FROM x11vnc/desktop
RUN apt-get update
RUN apt-get install -y build-essential python wget curl
WORKDIR /root
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb || exit 0
RUN apt-get -f install -y
RUN echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/userns.conf
