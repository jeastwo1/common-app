apps = HomeScreen Browser Boilerplate News Weather GestureGame Phone
TIZEN_IP=TizenNuc
#TIZEN_IP=192.168.6.36

#to avoid typing a password for each scp or ssh command you need to copy
#your public key over 
#
# ssh-copy-id app@TizenNuc
#
# This command will require your password and then you will be able to 
# use ssh and scp without a password from that user.

all:
	$(foreach app,$(apps), make -C $(app);)
	#cd  HomeScreen && make
	#cd  Browser && make
	#cd  Boilerplate && make
	#cd  News && make

deploy:
	$(foreach app,$(apps), make -C $(app) deploy TIZEN_IP=$(TIZEN_IP);)
	#cd HomeScreen && make deploy TIZEN_IP=192.168.6.53
	#cd Browser && make deploy TIZEN_IP=192.168.6.53
	#cd Boilerplate && make deploy TIZEN_IP=192.168.6.53
	#cd News && make deploy TIZEN_IP=192.168.6.53
	scp InstallWgts.sh app@$(TIZEN_IP):/home/app/
	ssh app@$(TIZEN_IP) ./InstallWgts.sh

run:
	ssh app@$(TIZEN_IP) "export DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/5000/dbus/user_bus_socket' && xwalkctl | egrep -e 'Home Screen' | awk '{print $1}' | xargs --no-run-if-empty xwalk-launcher"

clean:
	$(foreach app,$(apps), make -C $(app) clean;)
	#cd HomeScreen && make clean
	#cd Boilerplate && make clean
	#cd Browser && make clean
	#cd News && make clean
	cd Leap && make clean
	#cd GestureGame && make clean

install:
	cd HomeScreen && make install

